import { Component, ViewChild } from '@angular/core';

import Patient from '../patient';

import { SearchResultsBundle, ResearchStudySearchEntry } from '../services/search.service';
import { SearchResultsService, TrialQuery } from '../services/search-results.service';
import { ProgressSpinnerMode } from '@angular/material/progress-spinner';
import { BundleEntry } from '../fhir-types';
import { ResultsComponent } from '../results/results.component';

@Component({
  selector: 'app-results-page',
  templateUrl: './results-page.component.html',
  styleUrls: ['./results-page.component.css']
})
export class ResultsPageComponent {
  public patient: Promise<Patient> | Patient;
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

  constructor(private searchResultsService: SearchResultsService) {
    this.searchResults = this.searchResultsService.getResults();
  }

  public showRecord(): void {
    this.records = !this.records;
  }
}
