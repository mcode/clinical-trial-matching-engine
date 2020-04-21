import { CommonService } from './services/common/common.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { NgxSpinnerService } from "ngx-spinner";
import * as _ from 'lodash';

import { ClientService } from './smartonfhir/client.service';
import Patient from './patient';
import { UnpackMatchResults } from './export/parse-data';
import { ExportTrials } from './export/export-data';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'clinicalTrial';
  public self = this;
  constructor(public commonService: CommonService, private spinner: NgxSpinnerService, private fhirService: ClientService) {
    var paramPhase = '{ __type(name: "Phase") { enumValues { name } } }'
    var recPhase = '{ __type(name: "RecruitmentStatusEnum") { enumValues { name } } }'
    this.loadDropDownData(paramPhase, 'phase');
    this.loadDropDownData(recPhase, 'rec');
    this.patient = fhirService.getPatient().then(patient => {
      // Wrap the patient in a class that handles extracting values
      const p = new Patient(patient);
      // Also take this opportunity to set the zip code, if there is one
      let zipCode = p.getHomePostalCode();
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
  public searchPage: boolean = false;
  /*
  variable for show or hide search result Page
 * */
  public searchtable: boolean = true;
  /*
  variable for show or hide details Page
 * */
  public detailsPage: boolean = true;
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
  public  pages = [];
  public pageData = [];
  public selectedPage : any;
  public itemPerPages : any = 10;
  /*
     variable for create object of search clinical trial request
  * */
  searchReqObject: { zipCode: string | null, travelRadius: string | null, phase: string, recruitmentStatus: string } = {
    zipCode: null,
    travelRadius: null,
    phase: 'any',
    recruitmentStatus: 'all',
  }
  /*
    export text variable
  **/
  public exportButtonText: string = "Export All Trials";
  /*
    Function for load phase and recruitment trial data
 * */
  public loadDropDownData(req, val) {
    this.spinner.show();
    var self = this;
    var reqobj = {
      "inputParam": req,
    }
    self.commonService.getDropDownData(reqobj).subscribe(response => {
      if (response['status'] == 200) {
        if (val == 'phase') {
          var data = JSON.parse(response['_body']);
          self.phaseDropDown = data.data.__type.enumValues;
        } else {
          data = JSON.parse(response['_body']);
          self.recDropDown = data.data.__type.enumValues;
        }
        this.spinner.hide();
      }
      else { }
    },
      err => { }
    );
  }
  /*
    Function for search Clinical trial data
 * */
  public searchClinicalTrials(endCursor) {
    var self = this;
    self.itemPerPages = 10;
    this.spinner.show();
    if(endCursor == null){
      this.clinicalTraildata = [];
    }
    if (this.searchReqObject.zipCode == null) {
       alert("Enter Zipcode")
     }
     else{
      var req = '{baseMatches(first:30 after: "'  + endCursor + '"'
      req += ' conditions:[BRAIN_CANCER, GLIOBLASTOMA],baseFilters: {  '
      if (this.searchReqObject.zipCode != null) {
        req += 'zipCode: "' + this.searchReqObject.zipCode + '"'
      }
      if (this.searchReqObject.travelRadius != null && this.searchReqObject.travelRadius != "") {
        req += ',travelRadius: ' + this.searchReqObject.travelRadius
      }
      if (this.searchReqObject.phase != 'any') {
        req += ',phase:' + this.searchReqObject.phase
      }
      if (this.searchReqObject.recruitmentStatus != 'all') {
        req += ',recruitmentStatus:' + this.searchReqObject.recruitmentStatus
      }
      req += '}){totalCount '
      req += 'edges{ node{ nctId  title conditions gender description detailedDescription criteria sponsor overallContactPhone overallContactEmail overallStatus armGroups phase minimumAge studyType '
      req += 'maximumAge sites {  facility contactName  contactEmail contactPhone   latitude longitude }} cursor}    pageInfo { endCursor hasNextPage  }}}'
      var reqObj = {
        "inputParam": req,
      }
      self.commonService.searchClinialTrial(reqObj).subscribe(response => {
        if (response['status'] == 200) {
          var data = JSON.parse(response['_body']);
          if(self.clinicalTraildata.length != 0){
            self.clinicalTraildata.data.baseMatches.edges.push(...data.data.baseMatches.edges);
          }
          else{
            self.clinicalTraildata = data;
          }
          if(data.data.baseMatches.pageInfo.hasNextPage){
               this.searchClinicalTrials(data.data.baseMatches.pageInfo.endCursor);
          }
          else{
            self.clinicalTraildata.data.baseMatches.edges =  _.uniqBy(self.clinicalTraildata.data.baseMatches.edges, 'node.nctId');
            self.clinicalTraildataCopy = [...self.clinicalTraildata.data.baseMatches.edges]
            var newArray = [];
            var myArray = _.uniqBy(self.clinicalTraildata.data.baseMatches.edges, 'node.conditions');
            for (let i = 0; i < myArray.length; i++) {
              var tempArray = JSON.parse(myArray[i].node.conditions)
              for (let j = 0; j < tempArray.length; j++) {
                var t = {
                  key: tempArray[j]
                }
                newArray.push(t);
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
            ]
            for (let x = 0; x < self.filtersArray.length; x++) {
              for (let y = 0; y < self.filtersArray[x].data.length; y++) {
                var tempKey = {
                  val: self.filtersArray[x].data[y],
                  selectedItems: false,
                }
                self.filtersArray[x].data[y] = tempKey;
              }
            }
            this.searchtable = false;
            this.searchPage = true;
            this.countPages(this.clinicalTraildata);
          }
        }
        else { }
      },
        err => { }
      );
     }
  }
  /*
    Function for count pages
 * */
  public countPages(data){
    var self = this;
    self.pages = [];
    self.self.itemPerPages = parseInt(self.itemPerPages)
    var pageCount = data.data.baseMatches.edges.length / self.itemPerPages
    for(let i=0;i<pageCount;i++){
      var temp = {
        val:i+1,
        startIndex :i*self.itemPerPages,
        endIndex :( i*self.itemPerPages + self.itemPerPages)
      }
       self.pages.push(temp);
    }
   self.selectedPage = self.pages[0];
   self.viewPage(self.pages[0]);
   this.spinner.hide();
  }
  /*
    Function for view data based on selected page
 * */
  public viewPage(page){
    var self = this;
    self.selectedPage = page;
    self.pageData = JSON.parse(JSON.stringify(self.clinicalTraildata))
    self.pageData['data'].baseMatches.edges = self.pageData['data'].baseMatches.edges.slice(page.startIndex,page.endIndex);
  }
  /*
  Function for show details of clinical trial
  * */
  public showDeatails(i) {
    var self = this;
    self.detailPageSelectedData = self.clinicalTraildata.data.baseMatches.edges[i];
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
    var acc = document.getElementsByClassName("accordion");
    for (let i = 0; i < acc.length; i++) {
      acc[i].addEventListener("click", function () {
        this.classList.toggle("active");
        var panel = this.nextElementSibling;
        if (panel.style.display === "block") {
          panel.style.display = "none";
        } else {
          panel.style.display = "block";
        }
      });
    }
  }
  /*
    Function for apply selected filter
    * */
  public applyFilter() {
    var self = this;
    this.spinner.show();
    var filterArrays = [], filterArrayData = [];
    for (let i = 0; i < this.filtersArray.length; i++) {
      var res = {
        selecteditem: this.filtersArray[i].selectedVal,
        arrays: this.filtersArray[i].data.filter(records => records.selectedItems == true)
      }
      filterArrayData.push(res)
    }
    filterArrays = self.clinicalTraildataCopy;
    for (let x = 0; x < filterArrayData.length; x++) {
      if (filterArrayData[x].arrays.length != 0) {
        var filterArraysCopy = [];
        for (let y = 0; y < filterArrayData[x].arrays.length; y++) {
          for (let z = 0; z < filterArrays.length; z++) {
            if (filterArrayData[x].selecteditem == 'conditions') {
              if (this.checkValue(filterArrayData[x].arrays[y].val, JSON.parse(filterArrays[z].node.conditions)) == 'Exist') {
                filterArraysCopy.push(self.clinicalTraildataCopy[z]);
              }
            }
            else {
              if (filterArrayData[x].arrays[y].val === filterArrays[z].node[filterArrayData[x].selecteditem]) {
                filterArraysCopy.push(self.clinicalTraildataCopy[z]);
              }
            }
          }
        }
        filterArrays = filterArraysCopy;
      }
    }
    if (filterArrays.length != 0) {
      this.clinicalTraildata.data.baseMatches.edges = filterArrays;
    }
    else {
      this.clinicalTraildata.data.baseMatches.edges = self.clinicalTraildataCopy.data.baseMatches.edges;
    }
    this.countPages(this.clinicalTraildata)
  }
  /*
    Function for check selected condition exist or not
    * */
  public checkValue(value, arr) {
    var status = 'Not exist';
    for (var i = 0; i < arr.length; i++) {
      var name = arr[i];
      if (name == value) {
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
    var self = this;
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
    var self = this;
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
  /*
    Function add trial to Array of saved trials
  * */
  public saveTrial(trialData) {
    this.exportButtonText = "Export Saved Trials";
    if (!this.savedClinicalTrialsNctIds.has(trialData.node.nctId)) {
      this.savedClinicalTrials.push(trialData);
      this.savedClinicalTrialsNctIds.add(trialData.node.nctId);
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
      data = UnpackMatchResults(JSON.parse(JSON.stringify(this.clinicalTraildata))['data'].baseMatches.edges);
    }
    ExportTrials(data, "clinicalTrials");
  }

  onChange(val){
    this.countPages(this.clinicalTraildata)
  }

  public replace(value,val){
    let newVal = value.replace(/[\[\]_'""]+/g, ' ');
    if(val == 'drop'){
      return newVal.charAt(0).toUpperCase() + newVal.slice(1).toLowerCase();
    }else{
      return newVal;
    }
  }

}
