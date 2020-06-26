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

  public response = {
    "resourceType" : "ResearchStudy",
    "identifier" : [{  
    "use" : "official", 
    "system" : "http://clinicaltrilas.gov",
    "value" : "NCT02942264" 
  }], 
    "title" : "Zotiraciclib (TG02) Plus Dose-Dense or Metronomic Temozolomide Followed by Randomized Phase II Trial of Zotiraciclib (TG02) Plus Temozolomide Versus Temozolomide Alone in Adults With Recurrent Anaplastic Astrocytoma and Glioblastoma", 
   "status" : "active",  
   "phase" : { "text": "phase-1-phase2"},
   "category" : [{"text" :  "Interventional"}], 
   "condition" : [{ "text" :  "Brain Tumor"}, { "text" :  "Astrocytoma"}, { "text" :  "Astroglioma"}, { "text" :  "Glioblastoma"}, { "text" :  "Gliosarcoma"}], 
   "contact" : [{ "name" : " Matthew R Lindsley", 
    "telecom" : [
    {
    "system" : "phone", 
    "value" : "(240) 760-6534", 
    "use" : "work"
    },
    {
    "system" : "email", 
    "value" : "matthew.lindsley@nih.gov", 
    "use" : "work"
    }
    ]}], 
    "keyword" : [{"text" : "Brain Tumor"},{"text" : "Glioblastoma"},{"text" : "Relapse"},{"text" : "Randomized"},{"text" : "Temodar"}], 
    "location" : [{"coding": [{"code": "USA",
                              "display" : "United States"
                            }],
                    "text" : "United States"
                  }], 
    "description" : "\n      Background:\n\n        -  Zotiraciclib (TG02) is a pyrimidine-based multi-kinase inhibitor that has been shown to\n           have inhibitory effects on CDKs, Janus Kinase 2 (JAK2) and Fm-like tyrosine kinase 3\n           (Flt3). It is orally administered and penetrates blood brain barrier (BBB). There is\n           clinical experience in using Zotiraciclib (TG02) as both a single agent and in\n           combination with other chemotherapy agents for cancer treatment.\n\n        -  Temozolomide (TMZ) is an oral alkylating agent that has proven efficacy in anaplastic\n           glioma and glioblastoma. It was approved by the U.S. Food and Drug Administration (FDA)\n           to treat anaplastic astrocytoma and glioblastoma in adults. Both a dose-dense (dd)\n           schedule, 7 days on and 7 days off and a metronomic (mn) daily dosing schedule have been\n           used to treat recurrent high-grade gliomas.\n\n        -  Our preclinical data have demonstrated that Zotiraciclib (TG02) down-regulates CDK9\n           activity and its target proteins, such as anti-apoptotic protein Mcl-1, XIAP and\n           survivin. A treatment with Zotiraciclib (TG02) and TMZ has synergistic anti-glioma\n           effects in a variety of glioma models with different genetic background. This serves as\n           the basis for this proposed clinical trial.\n\n      Objectives:\n\n      Phase I:\n\n      -To determine the maximum tolerated dose (MTD) of Zotiraciclib (TG02) plus TMZ using both the\n      dd and mn TMZ schedules in adult patients with recurrent anaplastic astrocytoma or\n      glioblastoma/gliosarcoma.\n\n      Phase II:\n\n      -To determine the efficacy of Zotiraciclib (TG02) plus TMZ versus TMZ alone in patients with\n      recurrent WHO grade III or IV astrocytoma as determined by progression free survival.\n\n      Eligibility:\n\n        -  Documented pathology diagnosis of anaplastic astrocytoma [WHO grade III], or\n           glioblastoma/gliosarcoma (WHO grade IV) with recurrent disease. If the pathology\n           diagnosis is anaplastic glioma or anaplastic oligoastrocytoma, evidence of either intact\n           1p/19q chromosomes or molecular features suggesting astrocytic tumor must be present.\n           (including, but not limited to ATRX and/or TP53 mutation)\n\n        -  No prior use of bevacizumab as a treatment for brain tumor.\n\n        -  No more than two prior relapses for Phase I and no more than one prior relapse for Phase\n           II.\n\n        -  Patients must have recurrent disease, either histologically proven or with imaging\n           suggestive of recurrent disease\n\n        -  Tumor tissues available for review to confirm the histologic diagnosis.\n\n        -  Tumor tissue blocks available for molecular profiling analysis.\n\n      Design:\n\n        -  Phase I:\n\n             -  This portion of the study is conducted in two stages: The MTD finding and cohort\n                extension. Two treatment arms and several dose levels are planned.\n\n             -  In the MTD finding part, TMZ with two alternate schedules (dd and mn) in\n                combination with Zotiraciclib (TG02) will be administered.\n\n             -  A cohort extension of both arms will be performed at each MTD and the treatment arm\n                with a better progression free survival at 4 months (PFS4) will be selected for the\n                combination treatment arm for Phase II.\n\n             -  Pharmacokinetic, pharmacogenetic studies and neutrophil analysis will be performed\n                during the cohort extension of both arms.\n\n             -  A maximum of 72 patients will be enrolled to this component for the trial.\n\n        -  Phase II:\n\n             -  Patients will be randomized between two competing treatment arms: (\"winner\" of dd\n                vs mn) TMZ + Zotiraciclib (TG02) versus dd/mn TMZ alone using a Bayesian clinical\n                trial design. The dosage for the combination arm will be derived from the MTD\n                determined in the Phase I\n\n      component of the study.\n\n        -  The treatment schedule will be identical to that described above in the phase I\n           component, with each cycle comprising 28 days.\n\n        -  Patients will continue treatment until tumor progression or unacceptable toxicity\n           occurs.\n\n        -  At progression, patients randomized to the control arm (Temozolomide [TMZ] alone) will\n           be offered the opportunity to continue TMZ and additional treatment with Zotiraciclib\n           (TG02).\n    ",
    "enrollment" : [{   
    "reference" : "#grp1",
     "display" : "\n        -  INCLUSION CRITERIA:\n\n          -  Inclusion criteria are same in both Phase I and Phase II parts, except for the number\n             of prior disease relapses\n\n          -  Patients must have pathologic diagnosis of anaplastic astrocytoma defined as WHO grade\n             III or glioblastoma/gliosarcoma, WHO grade IV, which are confirmed by NCI Laboratory\n             of Pathology. If the pathology diagnosis is anaplastic glioma or anaplastic\n             oligoastrocytoma, evidence of either intact 1p/19q chromosomes or molecular features\n             suggesting astrocytic tumor must be present.\n\n        (including, but not limited to ATRX, TP53).\n\n          -  Patients must have recurrent disease, histologically proven or imaging suggestive of\n             recurrent disease as determined by PI. Prior implantation of Gliadel wafers is\n             acceptable, if tumor recurrence is confirmed by histologic examination of the\n             recurrent tumor\n\n          -  Patients must have the ability to understand and the willingness to sign a written\n             informed consent document.\n\n          -  Patients must be greater than or equal to 18 years old.\n\n          -  No more than two prior disease relapses to be eligible for the phase I portion of the\n             study and no more than one prior relapse to be eligible for phase II.\n\n          -  Patients must have undergone prior standard therapy for their primary disease. For\n             patients with glioblastoma, this would include surgical resection, or biopsy, if safe\n             resection was not permitted due to the tumor location, radiation and adjuvant\n             temozolomide. For patients with anaplastic astrocytoma, this would include surgical\n             resection, radiation and adjuvant chemotherapy PCV or temozolomide.\n\n          -  Tumor tissue must be available for review to confirm histological diagnosis.\n\n          -  Tumor block or unstained slides must be available for molecular profiling.\n\n          -  Karnofsky > 60 percent\n\n          -  Patients must have adequate bone marrow function (ANC > 1,500/mm3, platelet count of >\n             100,000/mm3), adequate liver function (ALT and AST< 3 times upper limit normal and\n             alkaline phosphatase < 2 times upper limit normal, total bilirubin < 1.5mg/dl), and\n             adequate renal function (BUN < 1.5 times institutional normal and serum creatinine <\n             1.5 mg/dl) prior to registration. These tests must be performed within 14 days prior\n             to registration. Total bilirubin: patients with Gilbert s Syndrome are eligible for\n             the study. (Total bilirubin level can be exempted from the eligibility criterion.)\n\n          -  Patients must have recovered from the toxic effects of prior therapy to less than\n             grade 2 toxicity per CTC version 4 (except deep vein thrombosis)\n\n          -  At the time of registration, subject must be removed from prior therapy as follows:\n\n               -  greater than or equal to (28 days) from any investigational agent,\n\n               -  greater than or equal to 4 weeks (28 days) from prior cytotoxic therapy,\n\n               -  greater than or equal to 2 weeks (14 days) from vincristine,\n\n               -  greater than or equal to 6 weeks (42 days) from nitrosoureas,\n\n               -  greater than or equal to 3 weeks (21 days) from procarbazine administration,\n\n               -  greater than or equal to 1 week (7 days) for non-cytotoxic agents, e.g.,\n                  interferon, tamoxifen, thalidomide, cis-retinoic acid, etc. radiosensitizer does\n                  not count.\n\n          -  Patients having undergone recent resection of recurrent or progressive tumor will be\n             eligible given all of the following conditions apply:\n\n               -  At least 2 weeks (14 days) have elapsed from the date of surgery and the patients\n                  have recovered from the effects of surgery.\n\n               -  Evaluable or measureable disease following resection of recurrent malignant\n                  glioma is not mandated for eligibility into the study.\n\n               -  To best assess the extent of residual disease post-operatively, a MRI should be\n                  done no later than 96 hours in the immediate post-operative period or at least\n                  within 4 weeks postoperatively, within 14 days prior to registration. If the\n                  96-hour scan is more than 14 days before registration, the scan needs to be\n                  repeated. The patient must have been on a stable steroid dose for at least 5 days\n                  prior to\n\n        the baseline MRI. Steroids may be initiated as clinically indicated once baseline imaging\n        has been completed with a goal of titrating steroids as soon as clinically warranted.\n\n          -  Patients must have received prior radiation therapy and must have an interval of\n             greater than or equal to 12 weeks (84 days) from the completion of radiation therapy\n             to study entry except if there is unequivocal evidence for tumor recurrence (such as\n             histological confirmation or advanced imaging data such as PET scan) in which case the\n             principal investigator s discretion may determine appropriate timepoint at which study\n             therapy may begin.\n\n          -  Women of childbearing potential must have a negative beta-HCG pregnancy test\n             documented within 14 days prior to registration. The effects of Zotiraciclib (TG02) on\n             the developing human fetus are unknown. For this reason, women of childbearing\n             potential must not be pregnant, must not be breast-feeding, and must practice adequate\n             contraception for the duration of the study, and for 30 days after the last dose of\n             study medication.\n\n          -  Male patients on treatment with Zotiraciclib (TG02) must agree to use an adequate\n             method of contraception for the duration of the study, and for 30 days after the last\n             dose of study medication as the effects of Zotiraciclib (TG02) on the developing human\n             fetus are unknown.\n\n          -  Patients must agree to enroll on the NOB Natural History protocol to allow the\n             assessment of molecular tumor markers.\n\n        EXCLUSION CRITERIA:\n\n          -  Patients who are receiving any other investigational agents. However, prior enrollment\n             on a study using investigational agents is acceptable\n\n          -  Patients with prior bevacizumab use for tumor treatment. Patients who received\n             bevacizumab for symptom management, including but not limited to cerebral edema,\n             pseudoprogression can be included in the study(To date, there have been no effective\n             regimens developed for recurrent malignant gliomas that are refractory to bevacizumab.\n             Inclusion of this patient population may impact the ability to determine the efficacy\n             of Zotiraciclib (TG02) with TMZ.)\n\n          -  Any serious medical condition, laboratory abnormality, or psychiatric illness that\n             would prevent the subject from providing informed consent.\n\n          -  Any condition, including the presence of clinically significant laboratory\n             abnormalities, which places the patient at unacceptable risk if he/she were to\n             participate in the study or confounds the ability to interpret data from the study.\n             These would include:\n\n               -  Active infection (including persistent fever) including known history of HIV or\n                  Hepatitis C infection, because these patients are at increased risk of lethal\n                  infections when treated with marrow-suppressive therapy.\n\n               -  Diseases or conditions that obscure toxicity or dangerously alter drug metabolism\n\n               -  Serious concurrent medical illness e.g. symptomatic congestive heart failure\n\n          -  History of allergic reactions attributed to compounds of similar chemical or biologic\n             composition to temozolomide and/or Zotiraciclib (TG02).\n\n          -  Patients with a history of any other cancer (except non-melanoma skin cancer or\n             melanoma in-situ following curative surgical resection; or carcinoma in-situ of the\n             cervix or bladder), unless in complete remission and off all therapy for that disease\n             for a minimum of 3 years, are ineligible.\n\n          -  Zotiraciclib (TG02) is primarily metabolized by CYP1A2 and CYP3A4. Patients receiving\n             any medications or substances that are strong inhibitors or inducers of CYP1A2 and/or\n             CYP3A4 are ineligible.\n\n          -  Patients, who continue to have prolonged QTc (males: greater than 450ms; females:\n             greater than 470ms as calculated by Fridericia s correction formula) despite normal\n             electrolyte balance and discontinuation of medications known to prolong QTc, will be\n             excluded from the study.\n",
     "type" : "Group"
    }],
  "sponsor" : {   
    "reference" : "#org1",
    "type" : "Organization"
  }, 
  "contained": [
        {
      "resourceType" : "Group",
      "actual": true,
      "type": "person",
       "id" : "grp1" 
       },
       {
        "resourceType" : "Organization",
        "active" : true, 
        "id" : "org1",
        "name" : " National Cancer Institute (NCI)", 
      "telecom" : [
        {
        "system" : "phone", 
        "value" : "(240) 760-6534", 
        "use" : "work"
        },
         {
        "system" : "email", 
        "value" : "matthew.lindsley@nih.gov", 
        "use" : "work"
        }
      ] 
    },
    {
         "resourceType" : "Practitioner",
         "active" : true, 
         "id": "prac1",
         "name" : [{
           "use" : "official", 
           "text" : "Jing Wu, M.D."
       }]
     },
     {
      "resourceType" : "Location",
      "id": "loc1",
       "name" : "National Institutes of Health Clinical Center", 
       "alias" : ["For more information at the NIH Clinical Center contact National Cancer Institute Referral Office"],
       "telecom" : [{"system" : "phone", 
                     "value" : "888-624-1937", 
                     "use" : "work" 
                    },
               {"system" : "email", 
                     "value" : " ", 
                     "use" : "work" 
                   }], 
       "position" : { 
       "longitude" : -77.097455, 
       "latitude" : 39.0023604
          }
     }
   ],
   
   "principalInvestigator" : { 
       "reference" : "#prac1",
       "type" : "Practitioner"
    },
    "site" : [{   
        "reference" : "#loc1",
        "type" : "Location"
     }], 
      "arm" : [{ 
         "name" : "Phase I Arm 1",
         "type" : {"text" : " Experimental "}, 
         "description" :  "dose dense TMZ 125 mg/m2 x 7 days on / 7days off plus Zotiraciclib (TG02) dose escatlation" 
       }, { 
         "name" : "Phase I Arm 2", 
         "type" : {"text" : " Experimental "}, 
         "description" : "metronomic TMZ 50 mg/ m2 daily plus Zotiraciclib (TG02) doseescalation " 
       }, { 
         "name" : " Phase II Arm 1", 
         "type" : {"text" : " Experimental "}, 
         "description" : " MTD of Zotiraciclib (TG02) from phase I plus and winner of dd vs metronomic TMZ from phase I" 
       },{ 
         "name" : " Phase II Arm 2", 
         "type" : {"text" : " Experimental "}, 
         "description" : "winner of dd vs metronomic TMZ from phase I alone " 
       } ],
       "objective" : [{ 
       "name" : "Phase I Trial of Zotiraciclib (TG02) Plus Dose-Dense or Metronomic Temozolomide Followed by Randomized Phase II Trial of Zotiraciclib (TG02) Plus Temozolomide Versus Temozolomide Alone in Adults With Recurrent Anaplastic Astrocytoma and Glioblastoma,  Label for the objective  (official title)"
     }]
   }
  
  /*
     variable for gathering patient bundle resources
  * */
  public bundleResources: any = [];

  constructor(private spinner: NgxSpinnerService, private trialScopeService: TrialScopeService, private fhirService: ClientService, private convertService: ConvertCodesService) {
    this.phaseDropDown = ["Early Phase 1", "Phase 1", "Phase 2", "Phase 3", "Phase 4"];
    this.recDropDown = ["ACTIVE_NOT_RECRUITING", "COMPLETED", "ENROLLING_BY_INVITATION", "NOT_YET_RECRUITING", "RECRUITING", "SUSPENDED", "TERMINATED", "UNKNOWN", "WITHDRAWN"];



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
    const patientBundle = createPatientBundle(this.searchReqObject, this.bundleResources);
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
