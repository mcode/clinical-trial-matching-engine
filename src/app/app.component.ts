import { CommonService } from './services/common/common.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import * as _ from 'lodash';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'clinicalTrial';
  public self = this;
  constructor(public commonService: CommonService, ) {
    var paramPhase = '{ __type(name: "Phase") { enumValues { name } } }'
    var recPhase = '{ __type(name: "RecruitmentStatusEnum") { enumValues { name } } }'
    this.loadDropDownData(paramPhase, 'phase');
    this.loadDropDownData(recPhase, 'rec');
  }
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
     variable for show details of selected clinical trial
  * */
  public detailPageSelectedData: any;
  /*
     variable for create object of search clinical trial request
  * */
  searchReqObject = {
    zipCode: null,
    travelRadius: null,
    phase: 'any',
    recruitmentStatus: 'all',
  }
  /*
    Function for load phase and recruitment trial data
 * */
  public loadDropDownData(req, val) {
    var self = this;
    var reqobj = {
      "inputParam": req
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
      }
      else { }
    },
      err => { }
    );
  }
  /*
    Function for search Clinical trial data
 * */
  public searchClinicalTrials() {
    var self = this;
    var req = '{baseMatches(conditions:[BRAIN_TUMOR, GLIOBLASTOMA],baseFilters: {  '
    if (this.searchReqObject.zipCode != null) {
      req += ',zipCode: "' + this.searchReqObject.zipCode + '"'
    }
    if (this.searchReqObject.travelRadius != null) {
      req += ',travelRadius: ' + this.searchReqObject.travelRadius
    }
    if (this.searchReqObject.phase != 'any') {
      req += ',phase:' + this.searchReqObject.phase
    }
    if (this.searchReqObject.recruitmentStatus != 'all') {
      req += ',recruitmentStatus:' + this.searchReqObject.recruitmentStatus
    }
    req += ',gender:FEMALE,age:50,studyType:INTERVENTIONAL}){totalCount '
    req += 'edges{ node{ nctId  title conditions gender description detailedDescription criteria sponsor overallContactPhone overallContactEmail overallStatus armGroups phase minimumAge studyType '
    req += 'maximumAge sites {  facility contactName  contactEmail contactPhone   latitude longitude }}} }}'
    var reqObj = {
      "inputParam": req
    }
    self.commonService.searchClinialTrial(reqObj).subscribe(response => {
      if (response['status'] == 200) {
        var data = JSON.parse(response['_body']);
        self.clinicalTraildata = data;
        self.clinicalTraildataCopy = [...data.data.baseMatches.edges]
        var newArray = [];
        var myArray = _.uniqBy(data.data.baseMatches.edges, 'node.conditions');
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
            data: _.uniq(_.map(data.data.baseMatches.edges, 'node.overallStatus'))
          },
          {
            val: 'Phase',
            selectedVal: 'phase',
            data: _.uniq(_.map(data.data.baseMatches.edges, 'node.phase'))
          },
          {
            val: 'Study Type',
            selectedVal: 'studyType',
            data: _.uniq(_.map(data.data.baseMatches.edges, 'node.studyType'))
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
      }
      else { }
    },
      err => { }
    );
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
}
