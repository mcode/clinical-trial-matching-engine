import { Component, ViewChild } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

import { ClientService } from '../smartonfhir/client.service';
import Patient from '../patient';
import { createPatientBundle } from '../bundle';
import { SearchResultsBundle, ResearchStudySearchEntry } from '../services/search.service';
import { SearchResultsService } from '../services/search-results.service';
import { ResearchStudyStatus, ResearchStudyPhase } from '../fhir-constants';
import { ProgressSpinnerMode } from '@angular/material/progress-spinner';
import { BundleEntry } from '../fhir-types';
import { SearchFieldsComponent } from '../search-fields/search-fields.component';
import { TrialQuery } from '../services/search-results.service';
import { Router } from '@angular/router';

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
  selector: 'app-search-page',
  templateUrl: './search-page.component.html',
  styleUrls: ['./search-page.component.css']
})
export class SearchPageComponent {
  patient: Patient;
  patientName: string | null;
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
   * Trials on the current page.
   */
  public selectedPageTrials: ResearchStudySearchEntry[];
  @ViewChild(SearchFieldsComponent)
  private searchFieldsComponent: SearchFieldsComponent;

  /**
   * Control overlay display
   */
  public showOverlay: boolean;

  /**
   * Text for the loading indicator
   */
  public loadingText = 'Loading...';
  /**
   * Current mode, either indeterminite or determinite.
   */
  public loadingMode: ProgressSpinnerMode = 'indeterminate' as 'indeterminate';
  public loadingPercentage = 0;

  /**
   * Store sorting preference
   */
  public sortType = 'likelihood';

  /**
   * Patient bundle resources from the FHIR client.
   */
  public bundleResources: BundleEntry[] = [];

  public records = false;

  constructor(
    private router: Router,
    private searchResultsService: SearchResultsService,
    private fhirService: ClientService,
    private toastr: ToastrService
  ) {
    // show loading screen while we pull the FHIR record
    this.showLoadingOverlay('Loading patient data...');
    fhirService
      .getPatient()
      .then((patient) => {
        // Wrap the patient in a class that handles extracting values
        this.patient = new Patient(patient);
        this.patientName = this.patient.getUsualName();
        // Also take this opportunity to set the zip code, if there is one
        const zipCode = this.patient.getHomePostalCode();
        if (zipCode) {
          this.searchFieldsComponent.zipCode.setValue(zipCode);
        }
      })
      .catch((err) => {
        console.log(err);
        this.toastr.error(err.message, 'Error Loading Patient Data:');
        return new Patient({ resourceType: 'Patient' });
      });

    // Gathering resources for patient bundle
    this.fhirService
      .getResources('Condition', {
        _profile: 'http://hl7.org/fhir/us/mcode/StructureDefinition/mcode-primary-cancer-condition'
      })
      .then((condition) => {
        const resourceTypes = ['Patient', 'Condition', 'MedicationStatement', 'Observation', 'Procedure'];
        const resourceParams = {
          Patient: {},
          Condition: { 'clinical-status': 'active' },
          MedicationStatement: {},
          Observation: {},
          Procedure: {}
        };
        if (condition.length > 0) {
          // get onset date of primary cancer condition
          const dateString = condition[0]['resource']['onsetDateTime'];
          if (dateString) {
            const newDate = new Date(dateString);
            newDate.setFullYear(newDate.getFullYear() - 2);
            const newStringDate = newDate.toISOString();
            // set search params for resource types: date more recent than 2 years before the primary cancer condition onset
            resourceParams['Observation'] = { date: 'ge' + newStringDate };
            resourceParams['Procedure'] = { date: 'ge' + newStringDate };
            resourceParams['MedicationStatement'] = { effective: 'ge' + newStringDate };
          }
        }
        const totalLoading = resourceTypes.length;
        let currentLoaded = 0;
        // Intentionally leave it indeterminite at 0, otherwise it disappears
        return Promise.all(
          resourceTypes.map((resourceType) => {
            return this.fhirService
              .getResources(resourceType, resourceParams[resourceType])
              .then((records) => {
                currentLoaded++;
                this.setLoadingProgress(currentLoaded, totalLoading);
                this.bundleResources.push(
                  ...(records.filter((record) => {
                    // Check to make sure it's a bundle entry
                    return 'fullUrl' in record && 'resource' in record;
                  }) as BundleEntry[])
                );
              })
              .catch((err) => {
                console.log(err);
                this.toastr.error(err.message, 'Error Loading Patient Data: ' + resourceType);
              });
          })
        ).finally(() => {
          // Always end
          this.hideLoadingOverlay();
        });
      })
      .catch((err) => {
        console.log(err);
        this.toastr.error(err.message, 'Error Loading Patient Data:');
        this.hideLoadingOverlay();
      });
  }

  /**
   * Execute a search on clinical trial data based on the current user.
   */
  public searchClinicalTrials(query: TrialQuery): void {
    // For now, just copy the values over
    this.searchResults = null;
    this.showLoadingOverlay('Searching clinical trials...');
    // Blank out any existing results
    if (query.zipCode === undefined || !/^[0-9]{5}$/.exec(query.zipCode)) {
      this.toastr.warning('Enter Valid Zip Code');
      this.hideLoadingOverlay();
      return;
    }
    if (query.travelRadius === undefined || query.travelRadius <= 0) {
      this.toastr.warning('Enter Valid Travel Radius');
      this.hideLoadingOverlay();
      return;
    }
    const patientBundle = createPatientBundle(query, this.bundleResources);
    this.searchResultsService.search(query, patientBundle).subscribe(
      (response) => {
        // Store the results
        this.searchResults = response;
        console.log(response);
        this.router.navigateByUrl('/results');
      },
      (err) => {
        console.error(err);
        // error alert to user
        this.toastr.error(err.message, 'Error Loading Clinical Trials:');
        this.hideLoadingOverlay();
      }
    );
  }

  /*
  Function for back search result page
  * */
  public backToSearch(): void {
    this.searchtable = false;
    this.searchPage = true;
    this.detailsPage = true;
  }

  /*
     Function for go to home page
  * */
  public backToHomePage(): void {
    this.searchtable = true;
    this.searchPage = false;
    this.detailsPage = true;
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

  private hideLoadingOverlay(): void {
    this.showOverlay = false;
  }

  private showLoadingOverlay(text = 'Loading...'): void {
    this.loadingText = text;
    this.showOverlay = true;
    this.loadingMode = 'indeterminate';
  }

  private setLoadingProgress(current: number, max: number): void {
    this.loadingMode = 'determinate';
    this.loadingPercentage = (current / max) * 100;
    console.log('Current loading: ' + this.loadingPercentage);
  }
}
