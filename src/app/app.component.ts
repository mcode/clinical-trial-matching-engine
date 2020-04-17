import { CommonService } from './services/common/common.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import * as _ from 'lodash';

import { ClientService } from './smartonfhir/client.service';
import Patient from './patient';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'clinicalTrial';
  public self = this;
  constructor(public commonService: CommonService, private spinner: NgxSpinnerService, private fhirService: ClientService) {
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
  }
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
     variable for show details of selected clinical trial
  * */
  public detailPageSelectedData: any;
  public  pages = [];
  public pageData = [];
  public selectedPage: any;
  public itemPerPages: any = 10;
  /*
     variable for create object of search clinical trial request
  * */
  searchReqObject: { zipCode: string | null, travelRadius: string | null, phase: string, recruitmentStatus: string } = {
    zipCode: null,
    travelRadius: null,
    phase: 'any',
    recruitmentStatus: 'all',
  };
  /*
    Function for load phase and recruitment trial data
 * */
  public loadDropDownData(req, val) {
    this.spinner.show();
    const self = this;
    const reqobj = {
      inputParam: req
    };
    self.commonService.getDropDownData(reqobj).subscribe(response => {
      if (val === 'phase') {
        self.phaseDropDown = response.data.__type.enumValues;
      } else {
        self.recDropDown = response.data.__type.enumValues;
      }
      this.spinner.hide();
    },
      err => { }
    );
  }
  /*
    Function for search Clinical trial data
 * */
  public searchClinicalTrials(endCursor) {
    const self = this;
    this.itemPerPages = 10;
    this.spinner.show();
    if (endCursor == null) {
      this.clinicalTraildata = [];
    }
    if (this.searchReqObject.zipCode == null) {
      alert('Enter Zipcode');
    } else {
      let req = `{baseMatches(first:30 after: "${endCursor}"`;
      req += ' conditions:[BRAIN_CANCER, GLIOBLASTOMA],baseFilters: {  ';
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
      self.commonService.searchClinialTrial(reqObj).subscribe(data => {
        if (self.clinicalTraildata.length !== 0) {
          self.clinicalTraildata.data.baseMatches.edges.push(...data.data.baseMatches.edges);
        } else {
          self.clinicalTraildata = data;
        }
        if (data.data.baseMatches.pageInfo.hasNextPage) {
          this.searchClinicalTrials(data.data.baseMatches.pageInfo.endCursor);
        } else {
          self.clinicalTraildata.data.baseMatches.edges = _.uniqBy(self.clinicalTraildata.data.baseMatches.edges, 'node.nctId');
          self.clinicalTraildataCopy = [...self.clinicalTraildata.data.baseMatches.edges];
          const newArray = [];
          const myArray = _.uniqBy(self.clinicalTraildata.data.baseMatches.edges, 'node.conditions');
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
              data: _.uniq(_.map(self.clinicalTraildata.data.baseMatches.edges, 'node.overallStatus'))
            },
            {
              val: 'Phase',
              selectedVal: 'phase',
              data: _.uniq(_.map(self.clinicalTraildata.data.baseMatches.edges, 'node.phase'))
            },
            {
              val: 'Study Type',
              selectedVal: 'studyType',
              data: _.uniq(_.map(self.clinicalTraildata.data.baseMatches.edges, 'node.studyType'))
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
        err => { }
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
  /*
    Function for view data based on selected page
 * */
  public viewPage(page) {
    const self = this;
    self.selectedPage = page;
    self.pageData = JSON.parse(JSON.stringify(self.clinicalTraildata));
    self.pageData['data'].baseMatches.edges = self.pageData['data'].baseMatches.edges.slice(page.startIndex, page.endIndex);
  }
  /*
  Function for show details of clinical trial
  * */
  public showDeatails(i) {
    this.detailPageSelectedData = this.clinicalTraildata.data.baseMatches.edges[i];
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
  }
  /*
    Function for apply selected filter
    * */
  public applyFilter() {
    const self = this;
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
        for (let y = 0; y < filter.arrays.length; y++) {
          for (let z = 0; z < filterArrays.length; z++) {
            if (filter.selecteditem === 'conditions') {
              if (this.checkValue(filter.arrays[y].val, JSON.parse(filterArrays[z].node.conditions)) === 'Exist') {
                filterArraysCopy.push(self.clinicalTraildataCopy[z]);
              }
            } else {
              if (filter.arrays[y].val === filterArrays[z].node[filter.selecteditem]) {
                filterArraysCopy.push(self.clinicalTraildataCopy[z]);
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
      this.clinicalTraildata.data.baseMatches.edges = self.clinicalTraildataCopy.data.baseMatches.edges;
    }
    this.countPages(this.clinicalTraildata);
  }
  /*
    Function for check selected condition exist or not
    * */
  public checkValue(value, arr) {
    let status = 'Not exist';
    for (let i = 0; i < arr.length; i++) {
      const name = arr[i];
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
    const self = this;
    if (!self.filtersArray[i].data[j].selectedItems) {
      self.filtersArray[i].data[j].selectedItems = true;
    } else {
      self.filtersArray[i].data[j].selectedItems = false;
    }
  }
  /*
     Function for clear Filter
  * */
  public clearFilter(i) {
    const self = this;
    self.filtersArray[i].data.forEach(element => {
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
}
