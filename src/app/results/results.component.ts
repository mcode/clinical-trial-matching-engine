import { Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { Router } from '@angular/router';

import Patient from '../patient';
import { SearchResultsBundle } from '../services/search.service';
import { ResearchStudySearchEntry } from '../services/ResearchStudySearchEntry';
import { BundleEntry } from '../fhir-types';
import { SearchResultsService, TrialQuery } from '../services/search-results.service';

/**
 * Provides basic information about a given page.
 */
class SearchPage {
  constructor(public index: number, public firstIndex: number, public lastIndex: number) {}
  toString(): string {
    return `[Page ${this.index} (${this.firstIndex}-${this.lastIndex})]`;
  }
}

/**
 * Internal class for filter data
 */
class FilterValue {
  id: string;
  constructor(public value: string, public enabled = false) {
    this.id = this.value.replace(/[^\w_-]+/g, '_');
  }
}

/**
 * Internal interface for filter data.
 */
class Filter {
  id: string;
  values: FilterValue[];
  activeFilterIndices: number[] = [];
  get activeFilters(): string[] {
    return this.activeFilterIndices.map((index) => this.values[index].value);
  }
  constructor(public name: string, public filterPath: string | null = null, values: Iterable<string>) {
    this.id = this.name.replace(/[^\w_-]+/g, '_');
    this.values = Array.from(values, (value) => new FilterValue(value));
  }
}

function compareByDist(trial1: ResearchStudySearchEntry, trial2: ResearchStudySearchEntry): number {
  return trial1.dist - trial2.dist;
}

function compareByMatch(trial1: ResearchStudySearchEntry, trial2: ResearchStudySearchEntry): number {
  return trial2.search.score - trial1.search.score;
}

@Component({
  selector: 'app-results',
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.css']
})
export class ResultsComponent implements OnInit {
  public patient: Promise<Patient> | Patient;
  /**
   * Data about the filters available for the current results.
   */
  public filters: Filter[] = [];
  public searchParameters: TrialQuery;
  /**
   * The most recent search results. If null, no search has been executed.
   */
  private _searchResults: SearchResultsBundle | null = null;
  get searchResults(): SearchResultsBundle | null {
    return this._searchResults;
  }
  set searchResults(resultsBundle: SearchResultsBundle | null) {
    this._searchResults = resultsBundle;
    // Create our pages array
    this.createPages();
    // Create our filters
    this.createFilters();
    // Display the results
    this.showPage(0);
  }
  /**
   * If filters have been applied, the filtered results.
   */
  public filteredResults: ResearchStudySearchEntry[] | null = null;
  /**
   * Total number of results found.
   */
  public get resultCount(): number {
    if (this.filteredResults === null) {
      return this.searchResults === null ? 0 : this.searchResults.totalCount;
    } else {
      return this.filteredResults.length;
    }
  }
  /**
   * The currently active page.
   */
  public selectedPage: SearchPage;
  /**
   * Array of page information.
   */
  public pages: SearchPage[];
  /**
   * Trials on the current page.
   */
  public selectedPageTrials: ResearchStudySearchEntry[];
  /**
   * The number of items per page.
   */
  public itemsPerPage = 10;

  /**
   * Store sorting preference
   */
  public sortType = 'likelihood';

  /**
   * Patient bundle resources from the FHIR client.
   */
  public bundleResources: BundleEntry[] = [];

  public records = false;

  constructor(private router: Router, private searchResultsService: SearchResultsService) {}

  ngOnInit(): void {
    // On init, restore values off the service
    this.searchParameters = this.searchResultsService.query;
    this.searchResults = this.searchResultsService.getResults();
    if (this.searchResults === null) {
      // If we have no search results, redirect back to the search page
      this.router.navigateByUrl('/search');
    }
  }

  /**
   * Gets the total number of pages.
   */
  get pageCount(): number {
    return this.pages.length;
  }

  get savedTrialCount(): number {
    return this.searchResultsService.savedCount;
  }

  isTrialSaved(trial: ResearchStudySearchEntry): boolean {
    return this.searchResultsService.isTrialSaved(trial);
  }

  /**
   * Get next 5 pages from current page index if they exist
   */
  public getNearest(): SearchPage[] {
    // find current page of items
    const starting = this.selectedPage.index;
    if (starting == 0) {
      return this.pages.slice(starting, starting + 5);
    } else if (starting == this.pages.length - 1) {
      return this.pages.slice(Math.max(0, starting - 4), starting + 1);
    } else if (starting == 1) {
      return this.pages.slice(0, 5);
    } else if (starting == this.pages.length - 2) {
      return this.pages.slice(Math.max(0, starting - 3), starting + 2);
    } else {
      return this.pages.slice(Math.max(0, starting - 2), starting + 3);
    }
  }

  /**
   * Show the given page.
   * @param page the 0-based page number to show
   */
  public showPage(page: number): void {
    if (this.searchResults === null) {
      console.error(`Cannot show page ${page}: no results`);
      return;
    }
    this.viewPage(this.pages[page]);
  }
  /**
   * View a specific page from within the pages array.
   */
  public viewPage(page: SearchPage): void {
    this.selectedPage = page;
    if (this.filteredResults === null) {
      this.selectedPageTrials = this.searchResults.researchStudies.slice(
        this.selectedPage.firstIndex,
        this.selectedPage.lastIndex
      );
    } else {
      this.selectedPageTrials = this.filteredResults.slice(page.firstIndex, page.lastIndex);
    }
  }
  /**
   * Populates the pages array based on the current items per pages data.
   * @param totalResults
   *          if given, the total number of results to create pages
   *          for, otherwise defaults to the current result count
   */
  private createPages(totalResults = this.resultCount): void {
    // Always create at least one page, even if it's empty
    this.pages = [new SearchPage(0, 0, Math.min(totalResults, this.itemsPerPage))];
    let pageIndex = 1,
      startIndex = this.itemsPerPage,
      lastIndex = this.itemsPerPage * 2;
    // Create all full pages past the first page
    for (; lastIndex < totalResults; pageIndex++, startIndex = lastIndex, lastIndex += this.itemsPerPage) {
      // Push a complete page
      this.pages.push(new SearchPage(pageIndex, startIndex, lastIndex));
    }
    if (startIndex < totalResults) {
      // Have a partial final page - in the case where there is a single page
      // that contains less than itemsPerPage, this will be skipped, because
      // startIndex will be itemsPerPage.
      this.pages.push(new SearchPage(pageIndex, startIndex, totalResults));
    }
  }
  /**
   * Create the filters
   */
  private createFilters(): void {
    if (this.searchResults === null) {
      this.filters = [];
    } else {
      this.filters = [
        new Filter('Recruitment', 'status', this.searchResults.buildFilters('status')),
        new Filter('Phase', 'phase.text', this.searchResults.buildFilters('phase.text')),
        new Filter('Study Type', 'category.text', this.searchResults.buildFilters('category.text'))
      ];
    }
  }

  /**
   * Display details of a given trial.
   */
  public showDetails(trial: ResearchStudySearchEntry): void {
    this.router.navigate(['results', 'details', trial.id]);
  }

  /**
   * Sets whether a given filter is enabled.
   * @param filterIdx the index of the filter in the filter array
   * @param valueIdx the index of the value to set
   */
  setFilterEnabled(filterIdx: number, valueIdx: number, enabled: boolean) {
    this.filters[filterIdx].values[valueIdx].enabled = enabled;
  }

  /*
    Function for get event of selected Filter
    * */
  public checkBoxClick(i, j): void {
    if (!this.filters[i].values[j].enabled) {
      this.filters[i].values[j].enabled = true;
    } else {
      this.filters[i].values[j].enabled = false;
    }
  }

  /**
   * Apply user-selected filters
   */
  public applyFilter(): void {
    let comparisonFunction = undefined;
    if (this.sortType == 'likelihood') {
      comparisonFunction = compareByMatch;
    } else if (this.sortType == 'distance') {
      comparisonFunction = compareByDist;
    } else {
      comparisonFunction = this.compareBySaved.bind(this);
    }

    const activeFilters: { filterPath: string; values: string[] }[] = [];
    for (const filter of this.filters) {
      // If there are any active filters, grab them
      if (filter.activeFilterIndices.length > 0) {
        activeFilters.push({
          filterPath: filter.filterPath,
          values: filter.activeFilters
        });
      }
    }
    if (activeFilters.length === 0) {
      // No filters active, don't filter
      this.filteredResults = null;
      this.searchResults.researchStudies.sort(comparisonFunction);
      this.createPages();
      this.showPage(0);
      return;
    }
    this.filteredResults = this.searchResults.researchStudies.filter((study) => {
      for (const filter of activeFilters) {
        const value = study.lookupString(filter.filterPath);
        // If it doesn't match, then filter it out
        if (!filter.values.some((v) => v === value)) return false;
      }
      // If all filters matched, return true
      return true;
    });

    this.filteredResults.sort(comparisonFunction);

    this.createPages(this.filteredResults.length);
    this.showPage(0);
  }

  /**
   * Disable all filters for the given filter.
   * @param filterIdx the filter index to clear
   */
  public clearFilter(filterIdx): void {
    // Reset the active filters to empty
    this.filters[filterIdx].activeFilterIndices = [];
    this.applyFilter();
  }

  /**
   * Save or remove a trial from the saved trials list.
   */
  public toggleTrialSaved(trial: ResearchStudySearchEntry): void {
    this.searchResultsService.toggleTrialSaved(trial);
  }
  /**
   * Sets whether or not a given trial is part of the saved set.
   * @param trial the trial to set whether or not it is saved
   * @param saved the save state of the trial
   */
  public setTrialSaved(trial: ResearchStudySearchEntry, saved: boolean): void {
    this.searchResultsService.setTrialSaved(trial, saved);
  }

  /**
   * Export the saved trials
   */
  public exportSavedTrials(): void {
    this.searchResultsService.exportSavedTrials();
  }

  pageChanged(event: PageEvent): void {
    // See if the page size has changed
    if (event.pageSize !== this.itemsPerPage) {
      this.itemsPerPage = event.pageSize;
      this.createPages();
    }
    this.showPage(event.pageIndex);
  }

  public showRecord(): void {
    this.records = !this.records;
  }

  public compareBySaved(trial2: ResearchStudySearchEntry, trial1: ResearchStudySearchEntry): number {
    return (
      Number(this.searchResultsService.isTrialSaved(trial1)) - Number(this.searchResultsService.isTrialSaved(trial2))
    );
  }
}
