import { Component } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';

import { ClientService } from './smartonfhir/client.service';
import Patient from './patient';
import { UnpackMatchResults } from './export/parse-data';
import { ExportTrials } from './export/export-data';
import { ConvertCodesService } from './services/convert-codes.service';
import { Condition, pullCodesFromConditions } from './condition';
import { TrialScopeService, TrialScopeResult } from './services/trial-scope.service';
import { Trial } from './trialscope';
import { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } from 'constants';

/**
 * Provides basic information about a given page.
 */
class SearchPage {
  constructor(public index: number, public firstIndex: number, public lastIndex: number) {
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
   * Total number of results found.
   */
  public resultCount = 0;
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
    this.fhirService.getConditions({clinicalstatus: 'active'}).then(
      records => {
        this.conditions = records.map(record => new Condition(record));
        convertService.convertCodes(pullCodesFromConditions(records)).subscribe(codes => this.trialScopeConditions = codes);
      }
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
    err => { /* FIXME: Handle this error */ }
    );
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
    let query = `conditions:[${this.trialScopeConditions.join(', ')}], baseFilters: { zipCode: "${this.searchReqObject.zipCode}"`;
    if (this.searchReqObject.travelRadius != null && this.searchReqObject.travelRadius !== '') {
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
    this.trialScopeService.baseMatches(query).subscribe(response => {
        // Store the results
        this.searchResults = response;
        this.resultCount = response.totalCount;
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
  public viewPage(page) {
    this.selectedPage = page;
    this.selectedPageTrials = this.searchResults.getTrials(this.selectedPage.firstIndex, this.selectedPage.lastIndex);
    this.searchtable = false;
    this.searchPage = true;
    this.spinner.hide();
  }
  /**
   * Populates the pages array based on the current items per pages data.
   */
  private createPages() {
    this.pages = [];
    let pageIndex = 0, startIndex = 0, lastIndex = this.itemsPerPage;
    for (; lastIndex < this.resultCount; pageIndex++, startIndex = lastIndex, lastIndex += this.itemsPerPage) {
      // Push a complete page
      this.pages.push(new SearchPage(pageIndex, startIndex, lastIndex));
    }
    if (startIndex < this.resultCount) {
      // Have a partial final page
      this.pages.push(new SearchPage(pageIndex, startIndex, this.resultCount));
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
  /*
    Function for back search result page
    * */
  public showHideAccordian(event) {
    // HTMLNodeList is not an iterator
    /* eslint-disable @typescript-eslint/prefer-for-of */
    const acc = document.getElementsByClassName('accordion');
    for (let i = 0; i < acc.length; i++) {
      acc[i].addEventListener('click', function() {
        this.classList.toggle('active');
        const panel = this.nextElementSibling;
        if (panel.style.display === 'block') {
          panel.style.display = 'none';
        } else {
          panel.style.display = 'block';
        }
      });
    }
    /* eslint-enable @typescript-eslint/prefer-for-of */
  }
  /*
    Function for apply selected filter
    * */
  public applyFilter() {/*
    this.spinner.show();
    const filterArrayData = [];
    for (const filter of this.filtersArray.length) {
      filterArrayData.push({
        selecteditem: filter.selectedVal,
        arrays: filter.data.filter(records => records.selectedItems === true)
      });
    }
    let filterArrays = this.clinicalTraildataCopy;
    for (const filter of filterArrayData) {
      if (filter.arrays.length !== 0) {
        const filterArraysCopy = [];
        for (const filterArray of filter.arrays) {
          for (let z = 0; z < filterArrays.length; z++) {
            if (filter.selecteditem === 'conditions') {
              if (this.checkValue(filterArray.val, JSON.parse(filterArrays[z].node.conditions)) === 'Exist') {
                filterArraysCopy.push(this.clinicalTraildataCopy[z]);
              }
            } else {
              if (filterArray.val === filterArrays[z].node[filter.selecteditem]) {
                filterArraysCopy.push(this.clinicalTraildataCopy[z]);
              }
            }
          }
        }
        filterArrays = filterArraysCopy;
      }
    }
    if (filterArrays.length !== 0) {
      this.clinicalTraildata.data.baseMatches.edges = filterArrays;
    } else {
      this.clinicalTraildata.data.baseMatches.edges = this.clinicalTraildataCopy.data.baseMatches.edges;
    }
    this.countPages(this.clinicalTraildata);*/
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
  public beckToHomePage() {
    this.searchtable = true;
    this.searchPage = false;
    this.detailsPage = true;
  }
  /**
   * Save or remove a trial from the saved trials list.
   */
  public toggleTrialSaved(trial: Partial<Trial>) {
    if (!this.savedClinicalTrialsNctIds.has(trial.nctId)) {
      this.savedClinicalTrials.push(trial);
      this.savedClinicalTrialsNctIds.add(trial.nctId);
    } else {
      const index = this.savedClinicalTrials.findIndex(t => t.nctId === trial.nctId);
      this.savedClinicalTrials.splice(index, 1);
      this.savedClinicalTrialsNctIds.delete(trial.nctId);
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
  public showRecord(){
    this.records = !this.records
  }

}
