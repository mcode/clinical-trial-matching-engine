import { Component, ViewChild, Input } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

import { ClientService } from '../smartonfhir/client.service';
import Patient from '../patient';
import { UnpackResearchStudyResults } from '../export/parse-data';
import { ExportTrials } from '../export/export-data';
import { SearchService, SearchResultsBundle, ResearchStudySearchEntry } from '../services/search.service';
import { ResearchStudyStatus, ResearchStudyPhase } from '../fhir-constants';
import { BundleEntry } from '../fhir-types';
import { TrialCardComponent } from '../trial-card/trial-card.component';

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
  constructor(public val: string, public selectedItems = false) {}
}

/**
 * Internal interface for filter data.
 */
class FilterData {
  data: FilterValue[];
  constructor(public val: string, public selectedVal: string | null = null, data: Iterable<string>) {
    this.data = Array.from(data, (value) => new FilterValue(value));
  }
}

export interface SearchFields {
  // This simply indicates that our fields are always string-able and is
  // necessary to pass the object to the patient bundle converter function.
  [key: string]: string | null;
  zipCode: string | null;
  travelRadius: string | null;
  /**
   * Recruitment phase (null means not specified/any)
   */
  phase: ResearchStudyPhase | null;
  /**
   * Recruitment status (null means not specified/any)
   */
  recruitmentStatus: ResearchStudyStatus | null;
}

@Component({
  selector: 'app-results',
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.css']
})
export class ResultsComponent {
  public patient: Promise<Patient> | Patient;
  /**
   * Filter data.
   */
  public filtersArray: FilterData[] = [];
  /**
   * The most recent search results. If null, no search has been executed.
   */
  private _searchResults: SearchResultsBundle | null = null;
  @Input()
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
   * Saved clinical trials.
   */
  public savedClinicalTrials: ResearchStudySearchEntry[] = [];
  /**
   * The set of saved clinical trial nctIds.
   */
  public savedClinicalTrialsNctIds = new Set<string>();
  /**
   * The trial whose details are being displayed.
   */
  public detailedTrial: ResearchStudySearchEntry | null = null;
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
  private itemsPerPage = 10;

  /**
   * Store sorting preference
   */
  public sortType = 'likelihood';

  /**
   * Patient bundle resources from the FHIR client.
   */
  public bundleResources: BundleEntry[] = [];

  public records = false;

  constructor() {}

  /**
   * Gets the total number of pages.
   */
  get pageCount(): number {
    return this.pages.length;
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
    this.filtersArray = [
      new FilterData('Recruitment', 'status', this.searchResults.buildFilters('status')),
      new FilterData('Phase', 'phase.text', this.searchResults.buildFilters('phase.text')),
      new FilterData('Study Type', 'category.text', this.searchResults.buildFilters('category.text'))
    ];
  }
  /**
   * Display details of a given trial.
   */
  public showDetails(i: number): void {
    if (TrialCardComponent.showDetailsFlag) {
      this.detailedTrial = this.selectedPageTrials[i];
    }
    // Reset the showDetailsFlag to true in case it has been turned off by the Save Study button.
    TrialCardComponent.showDetailsFlag = true;
  }

  /*
    Function for get event of selected Filter
    * */
  public checkBoxClick(i, j): void {
    if (!this.filtersArray[i].data[j].selectedItems) {
      this.filtersArray[i].data[j].selectedItems = true;
    } else {
      this.filtersArray[i].data[j].selectedItems = false;
    }
  }

  /**
   * Apply user-selected filters
   */
  public applyFilter(): void {
    let comparisonFunction = undefined;
    if (this.sortType == 'likelihood') {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      comparisonFunction = this.compareByMatch;
    } else {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      comparisonFunction = this.compareByDist;
    }

    const activeFilters: { selectedItem: string; values: string[] }[] = [];
    for (const filter of this.filtersArray) {
      // See if there are any active filters in this filter
      const values = filter.data.filter((value) => value.selectedItems === true);
      if (values.length > 0) {
        activeFilters.push({
          selectedItem: filter.selectedVal,
          values: values.map((v) => v.val)
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
        const value = study.lookupString(filter.selectedItem);
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

  /*
     Function for clear Filter
  * */
  public clearFilter(i): void {
    this.filtersArray[i].data.forEach((element) => {
      element.selectedItems = false;
    });
    this.applyFilter();
  }

  /**
   * Save or remove a trial from the saved trials list.
   */
  public toggleTrialSaved(trial: ResearchStudySearchEntry): void {
    this.setTrialSaved(trial, !this.savedClinicalTrialsNctIds.has(trial.nctId));
  }
  /**
   * Sets whether or not a given trial is part of the saved set.
   * @param trial the trial to set whether or not it is saved
   * @param saved the save state of the trial
   */
  public setTrialSaved(trial: ResearchStudySearchEntry, saved: boolean): void {
    if (saved) {
      if (!this.savedClinicalTrialsNctIds.has(trial.nctId)) {
        // Need to add it
        this.savedClinicalTrials.push(trial);
        this.savedClinicalTrialsNctIds.add(trial.nctId);
      }
    } else {
      if (this.savedClinicalTrialsNctIds.has(trial.nctId)) {
        // Need to remove it
        const index = this.savedClinicalTrials.findIndex((t) => t.nctId === trial.nctId);
        this.savedClinicalTrials.splice(index, 1);
        this.savedClinicalTrialsNctIds.delete(trial.nctId);
      }
    }
  }
  /*
    Function to export Array of saved trials
  * */
  public exportSavedTrials(): void {
    let data = [];
    if (this.savedClinicalTrials.length > 0) {
      data = UnpackResearchStudyResults(this.savedClinicalTrials);
    } else {
      data = UnpackResearchStudyResults(this.searchResults.researchStudies);
    }
    ExportTrials(data, 'clinicalTrials');
  }

  public updateItemsPerPage(items: string | number): void {
    if (typeof items === 'string') {
      items = parseInt(items);
    }
    // Clamp to 10-100 - this somewhat weird logic is to catch NaN
    if (!(items > 10 && items < 100)) {
      if (items > 100) {
        items = 100;
      } else {
        items = 10;
      }
    }
    this.itemsPerPage = items;
    // Have to recreate our pages
    this.createPages();
    // FIXME: Try and show the same page
    this.showPage(0);
  }

  public compareByDist(trial1: ResearchStudySearchEntry, trial2: ResearchStudySearchEntry): number {
    return trial1.dist - trial2.dist;
  }
  public compareByMatch(trial1: ResearchStudySearchEntry, trial2: ResearchStudySearchEntry): number {
    return trial2.search.score - trial1.search.score;
  }

  public showRecord(): void {
    this.records = !this.records;
  }
}
