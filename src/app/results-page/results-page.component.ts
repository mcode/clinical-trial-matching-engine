import { Component, ViewChild } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

import { ClientService } from '../smartonfhir/client.service';
import Patient from '../patient';
import { UnpackResearchStudyResults } from '../export/parse-data';
import { ExportTrials } from '../export/export-data';
import { SearchResultsBundle, ResearchStudySearchEntry } from '../services/search.service';
import { SearchResultsService, TrialQuery } from '../services/search-results.service';
import { ProgressSpinnerMode } from '@angular/material/progress-spinner';
import { BundleEntry } from '../fhir-types';
import { TrialCardComponent } from '../trial-card/trial-card.component';
import { ResultsComponent } from '../results/results.component';

@Component({
  selector: 'app-results-page',
  templateUrl: './results-page.component.html',
  styleUrls: ['./results-page.component.css']
})
export class ResultsPageComponent {
  title = 'clinicalTrial';
  public patient: Promise<Patient> | Patient;
  /**
   * Whether or not the details page is visible.
   */
  public detailsPage = true;
  /**
   * The most recent search results. If null, no search has been executed.
   */
  public searchResults: SearchResultsBundle | null = null;
  get searchParameters(): TrialQuery {
    return this.searchResultsService.query;
  }
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

  @ViewChild(ResultsComponent)
  private resultsComponent: ResultsComponent;

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
    private searchResultsService: SearchResultsService,
    private fhirService: ClientService,
    private toastr: ToastrService
  ) {
    this.searchResults = this.searchResultsService.getResults();
  }

  /**
   * Display details of a given trial.
   */
  public showDetails(i: number): void {
    if (TrialCardComponent.showDetailsFlag) {
      this.detailedTrial = this.selectedPageTrials[i];
      this.detailsPage = false;
    }
    // Reset the showDetailsFlag to true in case it has been turned off by the Save Study button.
    TrialCardComponent.showDetailsFlag = true;
  }
  /*
  Function for back search result page
  * */
  public backToSearch(): void {
    this.detailsPage = true;
  }

  /*
     Function for go to home page
  * */
  public backToHomePage(): void {
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

  public compareByDist(trial1: ResearchStudySearchEntry, trial2: ResearchStudySearchEntry): number {
    return trial1.dist - trial2.dist;
  }
  public compareByMatch(trial1: ResearchStudySearchEntry, trial2: ResearchStudySearchEntry): number {
    return trial2.search.score - trial1.search.score;
  }

  public showRecord(): void {
    this.records = !this.records;
  }
}
