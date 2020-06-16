import { Component } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';

import { ClientService } from './smartonfhir/client.service';
import Patient from './patient';
import { UnpackMatchResults } from './export/parse-data';
import { ExportTrials } from './export/export-data';
import { ConvertCodesService } from './services/convert-codes.service';
import { Condition, pullCodesFromConditions } from './condition';
import { createPatientBundle } from './bundle';
import { TrialScopeService, TrialScopeResult } from './services/trial-scope.service';
import { Trial } from './trialscope';

/**
 * Provides basic information about a given page.
 */
class SearchPage {
  constructor(public index: number, public firstIndex: number, public lastIndex: number) {
  }
  toString() {
    return `[Page ${this.index} (${this.firstIndex}-${this.lastIndex})]`;
  }
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
  /*
  variable for phase Drop Down
  * */
  public phaseDropDown = [];
  /*
 variable for recruitment Drop Down
 * */
  public recDropDown = [];
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
  /*
     variable for filters Array
  * */
  public filtersArray: any = [];
  /**
   * The most recent search results. If null, no search has been executed.
   */
  public searchResults: TrialScopeResult | null = null;
  /**
   * If filters have been applied, the filtered results.
   */
  public filteredResults: Partial<Trial>[] | null = null;
  /**
   * Total number of results found.
   */
  public get resultCount() {
    if (this.filteredResults === null) {
      return this.searchResults === null ? 0 : this.searchResults.totalCount;
    } else {
      return this.filteredResults.length;
    }
  }
  /**
   * Saved clinical trials.
   */
  public savedClinicalTrials: Partial<Trial>[] = [];
  /**
   * The set of saved clinical trial nctIds.
   */
  public savedClinicalTrialsNctIds = new Set<string>();
  /**
   * The trial whose details are being displayed.
   */
  public detailedTrial: Partial<Trial> | null = null;
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
  public selectedPageTrials: Partial<Trial>[];
  /**
   * The number of items per page.
   */
  private itemsPerPage = 10;
  /**
   * Loaded conditions from the patient.
   */
  public conditions: Condition[];
  /**
   * Conditions loaded from TrialScope.
   */
  public trialScopeConditions: string[];
  /**
   * The Angular form model for search options.
   */
  searchReqObject: { zipCode: string | null; travelRadius: string | null; phase: string; recruitmentStatus: string } = {
    zipCode: null,
    travelRadius: null,
    phase: 'any',
    recruitmentStatus: 'all',
  };
  /*
     variable for gathering patient bundle resources
  * */
  public bundleResources: any = [];

  constructor(private spinner: NgxSpinnerService, private trialScopeService: TrialScopeService, private fhirService: ClientService, private convertService: ConvertCodesService) {
    this.loadDropDownData('Phase', 'phase');
    this.loadDropDownData('RecruitmentStatusEnum', 'rec');
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
    //This can theoretically be removed once moved into server
    this.fhirService.getConditions({ "clinical-status": 'active' }).then(
      records => {
        this.conditions = records.map(record => new Condition(record));
        convertService.convertCodes(pullCodesFromConditions(records)).subscribe(codes => this.trialScopeConditions = codes);
      }
    );

    // Gathering resources for patient bundle
    this.fhirService.resourceTypes.map(resourceType =>
      this.fhirService.getResources(resourceType, this.fhirService.resourceParams[resourceType]).then(
        records => {
          records.map(record => this.bundleResources.push(record));
        }
      )
    );
  }

  /**
   * Gets the total number of pages.
   */
  get pageCount() {
    return this.pages.length;
  }

  /**
   * Load the available values for a dropdown from the server.
   * @param type the schema type to load values for
   * @param val currently either "phase" to populate the phase dropdown or
   * literally anything else to populate the "rec" recruitment status dropdown
   */
  public loadDropDownData(type: string, val: string) {
    this.spinner.show();
    this.trialScopeService.getDropDownData(type).subscribe(response => {
      if (val === 'phase') {
        this.phaseDropDown = response;
      } else {
        this.recDropDown = response;
      }
      this.spinner.hide();
    },
      err => {
        // FIXME: Handle this error
        console.error(err);
      });
  }
  /**
   * Execute a search on clinical trial data based on the current user.
   */
  public searchClinicalTrials() {
    this.itemsPerPage = 10;
    this.spinner.show();
    // Blank out any existing results
    if (this.searchReqObject.zipCode == null) {
      alert('Enter Zipcode');
      return;
    }
    // Create our query
    // patient bundle includes all search paramters except conditions
    let patientBundle = createPatientBundle(this.searchReqObject, this.bundleResources);
    // let conditions = `conditions:[${this.trialScopeConditions.join(', ')}] `; //, baseFilters: { zipCode: "${this.searchReqObject.zipCode}"`;

    /* if (this.searchReqObject.travelRadius != null && this.searchReqObject.travelRadius !== '') {
       // FIXME: Veryify travel radius is a number
       query += ',travelRadius: ' + this.searchReqObject.travelRadius;
     }
     if (this.searchReqObject.phase !== 'any') {
       query += ',phase:' + this.searchReqObject.phase;
     }
     if (this.searchReqObject.recruitmentStatus !== 'all') {
       query += ',recruitmentStatus:' + this.searchReqObject.recruitmentStatus;
     }
     query += ' }';
 
     */
    this.trialScopeService.baseMatches(patientBundle).subscribe(response => {
      // Store the results
      this.searchResults = response;
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
  public showPage(page: number) {
    if (this.searchResults === null) {
      console.error(`Cannot show page ${page}: no results`);
      return;
    }
    this.viewPage(this.pages[page]);
  }
  /**
   * View a specific page from within the pages array.
   */
  public viewPage(page: SearchPage) {
    this.selectedPage = page;
    console.log(`Showing page ${page}`);
    if (this.filteredResults === null) {
      this.selectedPageTrials = this.searchResults.getTrials(this.selectedPage.firstIndex, this.selectedPage.lastIndex);
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
  private createPages(totalResults = this.resultCount) {
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
  private createFilters() {
    const conditionsArray = this.searchResults.buildFilters<string>('conditions');
    const conditionsSet = new Set<string>();
    conditionsArray.forEach(json => {
      // Each condition is, in fact, a JSON object as a string
      try {
        const conditions = JSON.parse(json);
        if (Array.isArray(conditions)) {
          conditions.forEach(cond => conditionsSet.add(cond));
        }
      } catch (ex) {
        console.error('Error parsing conditions value (ignored for filter)');
        console.error(ex);
      }
    })
    this.filtersArray = [
      {
        val: 'My Conditions',
        selectedVal: 'conditions',
        data: Array.from(conditionsSet)
      },
      {
        val: 'Recruitment',
        selectedVal: 'overallStatus',
        data: Array.from(this.searchResults.buildFilters<string>('overallStatus'))
      },
      {
        val: 'Phase',
        selectedVal: 'phase',
        data: Array.from(this.searchResults.buildFilters<string>('phase'))
      },
      {
        val: 'Study Type',
        selectedVal: 'studyType',
        data: Array.from(this.searchResults.buildFilters<string>('studyType'))
      }
    ];
    for (const filter of this.filtersArray) {
      for (let y = 0; y < filter.data.length; y++) {
        filter.data[y] = {
          val: filter.data[y],
          selectedItems: false,
        };
      }
    }
  }
  /**
   * Display details of a given trial.
   */
  public showDetails(i) {
    this.detailedTrial = this.selectedPageTrials[i];
    this.searchtable = true;
    this.searchPage = true;
    this.detailsPage = false;
  }
  /*
  Function for back search result page
  * */
  public backToSearch() {
    this.searchtable = false;
    this.searchPage = true;
    this.detailsPage = true;
  }
  /**
   * Apply user-selected filters
   */
  public applyFilter() {
    const activeFilters = [];
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
    this.filteredResults = [];
    // Go through all the pages
    for (const page of this.searchResults.pages) {
      const filteredPage = page.trials.filter(trial => {
        for (const filter of activeFilters) {
          if (filter.selectedItem === 'conditions') {
            // This one is special
            try {
              const conditions = JSON.parse(trial.conditions);
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
            const value = trial[filter.selectedItem];
            // If it doesn't match, then filter it out
            if (!filter.values.some(v => v === value))
              return false;
          }
        }
        // If all filters matched, return true
        return true;
      });
      this.filteredResults.push(...filteredPage);
    }
    this.createPages(this.filteredResults.length);
    this.showPage(0);
  }
  /*
    Function for check selected condition exist or not
    * */
  public checkValue(value, arr) {
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
  public checkBoxClick(i, j) {
    if (!this.filtersArray[i].data[j].selectedItems) {
      this.filtersArray[i].data[j].selectedItems = true;
    } else {
      this.filtersArray[i].data[j].selectedItems = false;
    }
  }
  /*
     Function for clear Filter
  * */
  public clearFilter(i) {
    this.filtersArray[i].data.forEach(element => {
      element.selectedItems = false;
    });
    this.applyFilter();
  }
  /*
     Function for go to home page
  * */
  public backToHomePage() {
    this.searchtable = true;
    this.searchPage = false;
    this.detailsPage = true;
  }
  /**
   * Save or remove a trial from the saved trials list.
   */
  public toggleTrialSaved(trial: Partial<Trial>) {
    this.setTrialSaved(trial, !this.savedClinicalTrialsNctIds.has(trial.nctId));
  }
  /**
   * Sets whether or not a given trial is part of the saved set.
   * @param trial the trial to set whether or not it is saved
   * @param saved the save state of the trial
   */
  public setTrialSaved(trial: Partial<Trial>, saved: boolean) {
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
  public exportSavedTrials() {
    let data;
    if (this.savedClinicalTrials.length > 0) {
      data = UnpackMatchResults(this.savedClinicalTrials);
    } else {
      //data = UnpackMatchResults(JSON.parse(JSON.stringify(this.clinicalTraildata)).data.baseMatches.edges);
    }
    ExportTrials(data, 'clinicalTrials');
  }

  public updateItemsPerPage(items: string | number) {
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

  onChange(val) {
    console.log('onChange: ' + val)
    //this.countPages();
  }

  public replace(value, val) {
    const newVal = value.replace(/[\[\]_'""]+/g, ' ');
    if (val === 'drop') {
      return newVal.charAt(0).toUpperCase() + newVal.slice(1).toLowerCase();
    } else {
      return newVal;
    }
  }
  public records = false;
  public showRecord() {
    this.records = !this.records
  }

}
