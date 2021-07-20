import { Component, ViewChild, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';

import { RecordDataComponent } from '../record-data/record-data.component';
import Patient from '../patient';
import { createPatientBundle } from '../bundle';
import { PatientService } from '../services/patient.service';
import { SearchResultsService } from '../services/search-results.service';
import { ResearchStudyStatus, ResearchStudyPhase } from '../fhir-constants';
import { ProgressSpinnerMode } from '@angular/material/progress-spinner';
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
export class SearchPageComponent implements OnInit {
  patient: Patient;
  patientName: string | null;
  @ViewChild(SearchFieldsComponent)
  private searchFieldsComponent: SearchFieldsComponent;

  /**
   * Control loading overlay display
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

  constructor(
    private router: Router,
    private searchResultsService: SearchResultsService,
    private patientService: PatientService,
    private toastr: ToastrService,
    private dialog: MatDialog
  ) {
    // Set up the loading screen when constructed
    this.showLoadingOverlay('Loading...');
  }

  ngOnInit(): void {
    // Immediately load the patient when the view is initialized
    this.loadPatientData();
  }

  /**
   * Loads patient data from the FHIR server.
   */
  loadPatientData(): void {
    // Show the loading screen when the patient data is loaded
    this.showLoadingOverlay('Loading patient data...');
    this.patientService
      .getPatient()
      .then((patient) => {
        this.patient = patient;
        this.patientName = this.patient.getUsualName();
        // Also take this opportunity to set the zip code, if there is one
        const zipCode = this.patient.getHomePostalCode();
        if (zipCode) {
          this.searchFieldsComponent.zipCode.setValue(zipCode);
        }
        // With the patient loaded, move on to loading resources
        this.patientService.loadPatientData().subscribe(
          (event) => {
            if (event.total) this.setLoadingProgress(event.loaded, event.total);
          },
          (error) => {
            console.log(error);
            this.toastr.error(error.message, 'Error Loading Patient Data:');
            this.hideLoadingOverlay();
          },
          () => {
            this.hideLoadingOverlay();
          }
        );
      })
      .catch((err) => {
        console.log(err);
        this.toastr.error(err.message, 'Error Loading Patient Data:');
        this.hideLoadingOverlay();
        return new Patient({ resourceType: 'Patient' });
      });
  }

  /**
   * Execute a search on clinical trial data based on the current user.
   */
  public searchClinicalTrials(query: TrialQuery): void {
    // TODO: Check to make sure patient data was loaded
    // (Note that it shouldn't be possible to trigger this callback if it wasn't, but still.)
    const patientData = this.patientService.getPatientData();
    // For now, just copy the values over
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
    const patientBundle = createPatientBundle(query, patientData);
    this.searchResultsService.search(query, patientBundle).subscribe(
      () => {
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

  public showRecord(): void {
    // TODO: Check to make sure patient data was loaded.
    // (Note that it shouldn't be possible to trigger this callback if it wasn't, but still.)
    this.dialog.open(RecordDataComponent, {
      data: { patient: this.patient, resources: this.patientService.getPatientData() }
    });
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
  }
}
