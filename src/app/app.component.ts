import { CommonService } from './services/common/common.service';
import { Component } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import * as _ from 'lodash';

import { ClientService } from './smartonfhir/client.service';
import Patient from './patient';
import { UnpackMatchResults } from './export/parse-data';
import { ExportTrials } from './export/export-data';
import { ConvertCodesService } from './services/convert-codes.service';
import { Condition, pullCodesFromConditions } from './condition';

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
  /*
 variable for show or hide search Page
 * */
  public searchPage = false;
  /*
  variable for show or hide search result Page
 * */
  public searchtable = true;
  /*
  variable for show or hide details Page
 * */
  public detailsPage = true;
  /*
     variable for filters Array
  * */
  public filtersArray: any = [];
  /*
   variable for clinical Trail data
  * */
  public clinicalTraildata: any = [];
  /*
     variable for make  copy  of clinical Trail data
  * */
  public clinicalTraildataCopy: any = [];
  /*
    variable for Array of saved clinical trials
  * */
  public savedClinicalTrials: any = [];
  /*
      variable for set of saved clinical trials nctIds
  * */
  public savedClinicalTrialsNctIds: any = new Set();
  /*
     variable for show details of selected clinical trial
  * */
  public detailPageSelectedData: any;
  public pages = [];
  public pageData = [];
  public selectedPage: any;
  public itemPerPages: any = 10;
  /**
   * Loaded conditions from the patient.
   */
  public conditions: Condition[];
  /**
   * Conditions loaded from TrialScope.
   */
  public trialScopeConditions: string[];
  /*
     variable for create object of search clinical trial request
  * */
  searchReqObject: { zipCode: string | null; travelRadius: string | null; phase: string; recruitmentStatus: string } = {
    zipCode: null,
    travelRadius: null,
    phase: 'any',
    recruitmentStatus: 'all',
  };

  constructor(public commonService: CommonService, private spinner: NgxSpinnerService, private fhirService: ClientService, private convertService: ConvertCodesService) {
    const paramPhase = '{ __type(name: "Phase") { enumValues { name } } }';
    const recPhase = '{ __type(name: "RecruitmentStatusEnum") { enumValues { name } } }';
    this.loadDropDownData(paramPhase, 'phase');
    this.loadDropDownData(recPhase, 'rec');
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
    this.fhirService.getConditions({ clinicalstatus: 'active' }).then(
      records => {
        this.conditions = records.map(record => new Condition(record));
        convertService.convertCodes(pullCodesFromConditions(records)).subscribe(codes => this.trialScopeConditions = codes);
      }
    );
  }
  /*
    Function for load phase and recruitment trial data
 * */
  public loadDropDownData(req, val) {
    this.spinner.show();
    const reqobj = {
      inputParam: req
    };
    this.commonService.getDropDownData(reqobj).subscribe(response => {
      if (val === 'phase') {
        this.phaseDropDown = response.data.__type.enumValues;
      } else {
        this.recDropDown = response.data.__type.enumValues;
      }
      this.spinner.hide();
    },
      err => { /* FIXME: Handle this error */ }
    );
  }
  /*
    Function for search Clinical trial data
 * */
  public searchClinicalTrials(endCursor) {
    this.itemPerPages = 10;
    this.spinner.show();
    if (endCursor == null) {
      this.clinicalTraildata = [];
    }
    if (this.searchReqObject.zipCode == null) {
      alert('Enter Zipcode');
    } else {
      let req = `{baseMatches(first:30 after: "${endCursor}"`;
      req += ` conditions:[${this.trialScopeConditions.join(', ')}],baseFilters: { `;
      if (this.searchReqObject.zipCode != null) {
        req += `zipCode: "${this.searchReqObject.zipCode}"`;
      }
      if (this.searchReqObject.travelRadius != null && this.searchReqObject.travelRadius !== '') {
        req += ',travelRadius: ' + this.searchReqObject.travelRadius;
      }
      if (this.searchReqObject.phase !== 'any') {
        req += ',phase:' + this.searchReqObject.phase;
      }
      if (this.searchReqObject.recruitmentStatus !== 'all') {
        req += ',recruitmentStatus:' + this.searchReqObject.recruitmentStatus;
      }
      req += `})
      {
        totalCount
        edges {
          node {
            nctId title conditions gender description detailedDescription
            criteria sponsor overallContactPhone overallContactEmail
            overallStatus armGroups phase minimumAge studyType
            maximumAge sites {
              facility contactName contactEmail contactPhone latitude longitude
            }
          }
          cursor
        }
        pageInfo { endCursor hasNextPage }
      } }`;
      const reqObj = {
        inputParam: req
      };
      this.commonService.searchClinialTrial(reqObj).subscribe(data => {
        if (this.clinicalTraildata.length !== 0) {
          this.clinicalTraildata.data.baseMatches.edges.push(...data.data.baseMatches.edges);
        } else {
          this.clinicalTraildata = data;
        }
        if (data.data.baseMatches.pageInfo.hasNextPage) {
          this.searchClinicalTrials(data.data.baseMatches.pageInfo.endCursor);
        } else {
          this.clinicalTraildata.data.baseMatches.edges = _.uniqBy(this.clinicalTraildata.data.baseMatches.edges, 'node.nctId');
          this.clinicalTraildataCopy = [...this.clinicalTraildata.data.baseMatches.edges];
          const newArray = [];
          const myArray = _.uniqBy(this.clinicalTraildata.data.baseMatches.edges, 'node.conditions');
          for (const condition of myArray) {
            const tempArray = JSON.parse(condition.node.conditions);
            for (const e of tempArray) {
              newArray.push({ key: e });
            }
          }
          this.filtersArray = [
            {
              val: 'My Conditions',
              selectedVal: 'conditions',
              data: _.uniq(_.map(newArray, 'key'))
            },
            {
              val: 'Recruitment',
              selectedVal: 'overallStatus',
              data: _.uniq(_.map(this.clinicalTraildata.data.baseMatches.edges, 'node.overallStatus'))
            },
            {
              val: 'Phase',
              selectedVal: 'phase',
              data: _.uniq(_.map(this.clinicalTraildata.data.baseMatches.edges, 'node.phase'))
            },
            {
              val: 'Study Type',
              selectedVal: 'studyType',
              data: _.uniq(_.map(this.clinicalTraildata.data.baseMatches.edges, 'node.studyType'))
            }
          ];
          for (const filter of this.filtersArray.length) {
            for (let y = 0; y < filter.data.length; y++) {
              filter.data[y] = {
                val: filter.data[y],
                selectedItems: false,
              };
            }
          }
          this.searchtable = false;
          this.searchPage = true;
          this.countPages(this.clinicalTraildata);
        }
      },
        err => { /* FIXME: Handle this error */ }
      );
    }
  }
  /*
    Function for count pages
 * */
  public countPages(data) {
    this.pages = [];
    this.self.itemPerPages = parseInt(this.itemPerPages, 10);
    const pageCount = data.data.baseMatches.edges.length / this.itemPerPages;
    for (let i = 0; i < pageCount; i++) {
      this.pages.push({
        val: i + 1,
        startIndex: i * this.itemPerPages,
        endIndex: (i + 1) * this.itemPerPages
      });
    }
    this.selectedPage = this.pages[0];
    this.viewPage(this.pages[0]);
    this.spinner.hide();
  }
  /**
   * Function to view data based on selected page
   */
  public viewPage(page) {
    this.selectedPage = page;
    this.pageData = this.clinicalTraildata.data.baseMatches.edges.slice(page.startIndex, page.endIndex);
  }
  /*
  Function for show details of clinical trial
  * */
  public showDeatails(i) {
    this.detailPageSelectedData = this.pageData[i];
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
      acc[i].addEventListener('click', function () {
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
  public applyFilter() {
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
    this.countPages(this.clinicalTraildata);
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
  /*
    Function add/remove trial to/from Array of saved trials
  * */
  public saveTrial(trialData) {
    if (!this.savedClinicalTrialsNctIds.has(trialData.node.nctId)) {
      this.savedClinicalTrials.push(trialData);
      this.savedClinicalTrialsNctIds.add(trialData.node.nctId);
    } else {
      let index;
      this.savedClinicalTrials.some(i => {
        if (i.node.nctId === trialData.node.nctId) {
          index = this.savedClinicalTrials.indexOf(i, 0);
        }
      });
      this.savedClinicalTrials.splice(index, 1);
      this.savedClinicalTrialsNctIds.delete(trialData.node.nctId);
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
      data = UnpackMatchResults(JSON.parse(JSON.stringify(this.clinicalTraildata)).data.baseMatches.edges);
    }
    ExportTrials(data, 'clinicalTrials');
  }

  onChange(val) {
    this.countPages(this.clinicalTraildata);
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
