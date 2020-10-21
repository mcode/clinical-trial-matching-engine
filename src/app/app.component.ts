import { Component } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';

import { ClientService } from './smartonfhir/client.service';
import Patient from './patient';
import { UnpackResearchStudyResults } from './export/parse-data';
import { ExportTrials } from './export/export-data';
import { createPatientBundle } from './bundle';
import { SearchService, SearchResultsBundle, ResearchStudySearchEntry } from './services/search.service';
import {
  ResearchStudyStatus,
  ResearchStudyPhase,
  ResearchStudyStatusDisplay,
  ResearchStudyPhaseDisplay
} from './fhir-constants';
import { fhirclient } from 'fhirclient/lib/types';
import { TrialCardComponent } from './trial-card/trial-card.component';

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
  constructor(public value: string, public display: string) {}
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
    recruitmentStatus: null
  };
  /**
   * Patient bundle resources from the FHIR client.
   */
  public bundleResources: fhirclient.FHIR.BundleEntry[] = [];

  constructor(
    private spinner: NgxSpinnerService,
    private searchService: SearchService,
    private fhirService: ClientService
  ) {
    this.phaseDropDown = Object.values(ResearchStudyPhase).map((value) => {
      return new DropDownValue(value, ResearchStudyPhaseDisplay[value]);
    });
    this.recDropDown = Object.values(ResearchStudyStatus).map((value) => {
      return new DropDownValue(value, ResearchStudyStatusDisplay[value]);
    });

    // show loading screen while we pull the FHIR record
    this.spinner.show('load-record');

    this.patient = fhirService.getPatient().then((patient) => {
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
    let resourceTypeCount = 0;
    this.fhirService
      .getResources('Condition', {
        _profile: 'http://hl7.org/fhir/us/mcode/StructureDefinition/mcode-primary-cancer-condition'
      })
      .then((condition) => {
        if (condition.length > 0) {
          // get onset date of primary cancer condition
          const dateString = condition[0]['resource']['onsetDateTime'];
          if (dateString) {
            const newDate = new Date(dateString);
            newDate.setFullYear(newDate.getFullYear() - 2);
            const newStringDate = newDate.toISOString();
            // set search params for resource types: date more recent than 2 years before the primary cancer condition onset
            this.fhirService.resourceParams['Observation'] = { date: 'ge' + newStringDate };
            this.fhirService.resourceParams['Procedure'] = { date: 'ge' + newStringDate };
            this.fhirService.resourceParams['MedicationStatement'] = { effective: 'ge' + newStringDate };
          }
        }
        this.fhirService.resourceTypes.map((resourceType) => {
          this.fhirService.getResources(resourceType, this.fhirService.resourceParams[resourceType]).then((records) => {
            this.bundleResources.push(
              ...(records.filter((record) => {
                // Check to make sure it's a bundle entry
                return 'fullUrl' in record && 'resource' in record;
              }) as fhirclient.FHIR.BundleEntry[])
            );
            resourceTypeCount++;
            if (this.fhirService.resourceTypes.length === resourceTypeCount) {
              // remove loading screen when we've loaded our final resource type
              this.spinner.hide('load-record');
            }
          });
        });
      });
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
    this.spinner.show('load');
    // Blank out any existing results
    if (this.searchReqObject.zipCode == null) {
      alert('Enter Zipcode');
      return;
    }
    // patient bundle includes all search paramters except conditions
    const patientBundle = createPatientBundle(this.searchReqObject, this.bundleResources);
    this.searchService.searchClinicalTrials(patientBundle).subscribe(
      (response) => {
        // Store the results

        this.searchResults = response;
        console.log(response);
        // Create our pages array
        this.createPages();
        // Create our filters
        this.createFilters();
        // Display the results
        this.showPage(0);
      },
      (err) => {
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
    if (this.filteredResults === null) {
      this.selectedPageTrials = this.searchResults.researchStudies.slice(
        this.selectedPage.firstIndex,
        this.selectedPage.lastIndex
      );
    } else {
      this.selectedPageTrials = this.filteredResults.slice(page.firstIndex, page.lastIndex);
    }
    this.searchtable = false;
    this.searchPage = true;
    this.spinner.hide('load');
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
    if(TrialCardComponent.showDetailsFlag){
      this.detailedTrial = this.selectedPageTrials[i];
      this.searchtable = true;
      this.searchPage = true;
      this.detailsPage = false;
    }
    // Reset the showDetailsFlag to true in case it has been turned off by the Save Study button.
    TrialCardComponent.showDetailsFlag = true;
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
    this.createPages(this.filteredResults.length);
    this.showPage(0);
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
    this.filtersArray[i].data.forEach((element) => {
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

  onChange(val): void {
    console.log('onChange: ' + val);
    //this.countPages();
  }

  public records = false;
  public showRecord(): void {
    this.records = !this.records;
  }
}
