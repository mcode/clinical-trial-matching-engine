import { Component } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';

import { ClientService } from './smartonfhir/client.service';
import Patient from './patient';
import { UnpackMatchResults } from './export/parse-data';
import { ExportTrials } from './export/export-data';
import { createPatientBundle } from './bundle';
import { SearchService, SearchResultsBundle, ResearchStudySearchEntry } from './services/search.service';
import { ResearchStudyStatus, ResearchStudyPhase, ResearchStudyStatusDisplay, ResearchStudyPhaseDisplay } from './fhir-constants';
import { fhirclient } from 'fhirclient/lib/types';

/**
 * Provides basic information about a given page.
 */
class SearchPage {
  constructor(public index: number, public firstIndex: number, public lastIndex: number) {
  }
  toString(): string {
    return `[Page ${this.index} (${this.firstIndex}-${this.lastIndex})]`;
  }
}

/**
 * Internal class for filter data
 */
class FilterValue {
  constructor(public val: string, public selectedItems = false) {
  }
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

interface SearchFields {
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

class DropDownValue {
  constructor(public value: string, public display: string) { }
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'clinicalTrial';
  public self = this;
  public patient: Promise<Patient> | Patient;
  /**
   * Trial phase drop-down values.
   */
  public phaseDropDown: DropDownValue[] = [];
  /**
   * Recruitment phase drop-down values.
   */
  public recDropDown: DropDownValue[] = [];
  /**
   * Whether or not the search form (not results) page is visible
   */
  public searchPage = false;
  /**
   * Whether or not the search results page is visible
   */
  public searchtable = true;
  /**
   * Whether or not the details page is visible.
   */
  public detailsPage = true;
  /**
   * Filter data.
   */
  public filtersArray: FilterData[] = [];
  /**
   * The most recent search results. If null, no search has been executed.
   */
  public searchResults: SearchResultsBundle | null = null;
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
   * The Angular form model for search options.
   */
  searchReqObject: SearchFields = {
    zipCode: null,
    travelRadius: null,
    phase: null,
    recruitmentStatus: null,
  };
  /**
   * Patient bundle resources from the FHIR client.
   */
  public bundleResources: fhirclient.FHIR.BundleEntry[] = [];

  constructor(private spinner: NgxSpinnerService, private searchService: SearchService, private fhirService: ClientService) {
    this.phaseDropDown = Object.values(ResearchStudyPhase).map((value) => {
      return new DropDownValue(value, ResearchStudyPhaseDisplay[value]);
    });
    this.recDropDown = Object.values(ResearchStudyStatus).map((value) => {
      return new DropDownValue(value, ResearchStudyStatusDisplay[value]);
    });

    this.patient = fhirService.getPatient().then(patient => {
      // Wrap the patient in a class that handles extracting values
      const p = new Patient(patient);
      // Also take this opportunity to set the zip code, if there is one
      const zipCode = p.getHomePostalCode();
      if (zipCode) {
        if (!this.searchReqObject.zipCode) {
          this.searchReqObject.zipCode = zipCode;
        }
      }
      return p;
    });

    // Gathering resources for patient bundle
    this.fhirService.resourceTypes.map(resourceType =>
      this.fhirService.getResources(resourceType, this.fhirService.resourceParams[resourceType]).then(
        records => {
          this.bundleResources.push(...(records.filter((record) => {
            // Check to make sure it's a bundle entry
            return 'fullUrl' in record && 'resource' in record;
          }) as fhirclient.FHIR.BundleEntry[]));
        }
      )
    );
  }

  /**
   * Gets the total number of pages.
   */
  get pageCount(): number {
    return this.pages.length;
  }

  /**
   * Execute a search on clinical trial data based on the current user.
   */
  public searchClinicalTrials(): void {
    this.itemsPerPage = 10;
    this.spinner.show();
    // Blank out any existing results
    if (this.searchReqObject.zipCode == null) {
      alert('Enter Zipcode');
      return;
    }
    // patient bundle includes all search paramters except conditions
    const patientBundle = createPatientBundle(this.searchReqObject, this.bundleResources);
    this.searchService.searchClinicalTrials(patientBundle).subscribe(response => {
      // Store the results

      this.searchResults = response;
      console.log(response)
      // Create our pages array
      this.createPages();
      // Create our filters
      this.createFilters();
      // Display the results
      this.showPage(0);
    },
      err => {
        console.error(err);
      }
    );
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
    console.log(`Showing page ${page}`);
    if (this.filteredResults === null) {
      this.selectedPageTrials = this.searchResults.researchStudies.slice(this.selectedPage.firstIndex, this.selectedPage.lastIndex);
    } else {
      this.selectedPageTrials = this.filteredResults.slice(page.firstIndex, page.lastIndex);
    }
    this.searchtable = false;
    this.searchPage = true;
    this.spinner.hide();
  }
  /**
   * Populates the pages array based on the current items per pages data.
   * @param totalResults
   *          if given, the total number of results to create pages
   *          for, otherwise defaults to the current result count
   */
  private createPages(totalResults = this.resultCount): void {
    console.log(`Creating pages for ${totalResults} results`);
    // Always create at least one page, even if it's empty
    this.pages = [new SearchPage(0, 0, Math.min(totalResults, this.itemsPerPage))];
    let pageIndex = 1, startIndex = this.itemsPerPage, lastIndex = this.itemsPerPage * 2;
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
    const conditionsArray = this.searchResults.buildFilters('condition.text');
    const conditionsSet = new Set<string>();
    conditionsArray.forEach(conditions => {
      if (Array.isArray(conditions)) {
        conditions.forEach(cond => conditionsSet.add(cond));
      } else {
        console.error('Unexpected object for conditions');
        console.error(conditions);
      }
    });
    this.filtersArray = [
      new FilterData('My Conditions', 'conditions', conditionsSet),
      new FilterData('Recruitment', 'status', this.searchResults.buildFilters('status')),
      new FilterData('Phase', 'phase.text', this.searchResults.buildFilters('phase.text')),
      new FilterData('Study Type', 'category.text', this.searchResults.buildFilters('category.text'))
    ];
  }
  /**
   * Display details of a given trial.
   */
  public showDetails(i: number): void {
    this.detailedTrial = this.selectedPageTrials[i];
    this.searchtable = true;
    this.searchPage = true;
    this.detailsPage = false;
  }
  /*
  Function for back search result page
  * */
  public backToSearch(): void {
    this.searchtable = false;
    this.searchPage = true;
    this.detailsPage = true;
  }

  /**
   * Apply user-selected filters
   */
  public applyFilter(): void {
    const activeFilters: { selectedItem: string; values: string[] }[] = [];
    for (const filter of this.filtersArray) {
      // See if there are any active filters in this filter
      const values = filter.data.filter(value => value.selectedItems === true);
      if (values.length > 0) {
        activeFilters.push({
          selectedItem: filter.selectedVal,
          values: values.map(v => v.val)
        });
      }
    }
    if (activeFilters.length === 0) {
      // No filters active, don't filter
      this.filteredResults = null;
      this.createPages();
      this.showPage(0);
      return;
    }
    this.filteredResults = this.searchResults.researchStudies.filter(study => {
      for (const filter of activeFilters) {
        if (filter.selectedItem === 'conditions') {
          // This one is special
          try {
            const conditions = JSON.parse(study.conditions);
            if (Array.isArray(conditions)) {
              if (!conditions.some(v => filter.values.includes(v)))
                return false;
            } else {
              console.error('Skipping trial with invalid conditions (not an array)');
              return false;
            }
          } catch (ex) {
            console.error('Skipping trial with unparseable conditions');
            console.error(ex);
            return false;
          }
        } else {
          const value = study.lookupString(filter.selectedItem);
          // If it doesn't match, then filter it out
          if (!filter.values.some(v => v === value))
            return false;
        }
      }
      // If all filters matched, return true
      return true;
    });
    this.createPages(this.filteredResults.length);
    this.showPage(0);
  }
  /*
    Function for check selected condition exist or not
    * */
  public checkValue(value, arr): string {
    let status = 'Not exist';
    for (const name of arr) {
      if (name === value) {
        status = 'Exist';
        break;
      }
    }
    return status;
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
  /*
     Function for clear Filter
  * */
  public clearFilter(i): void {
    this.filtersArray[i].data.forEach(element => {
      element.selectedItems = false;
    });
    this.applyFilter();
  }
  /*
     Function for go to home page
  * */
  public backToHomePage(): void {
    this.searchtable = true;
    this.searchPage = false;
    this.detailsPage = true;
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
        const index = this.savedClinicalTrials.findIndex(t => t.nctId === trial.nctId);
        this.savedClinicalTrials.splice(index, 1);
        this.savedClinicalTrialsNctIds.delete(trial.nctId);
      }
    }
  }
  /*
    Function to export Array of saved trials
  * */
  public exportSavedTrials(): void {
    let data;
    if (this.savedClinicalTrials.length > 0) {
      //data = UnpackMatchResults(this.savedClinicalTrials);
    } else {
      //data = UnpackMatchResults(JSON.parse(JSON.stringify(this.clinicalTraildata)).data.baseMatches.edges);
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

  onChange(val): void {
    console.log('onChange: ' + val)
    //this.countPages();
  }

  public records = false;
  public showRecord(): void {
    this.records = !this.records
  }

}
