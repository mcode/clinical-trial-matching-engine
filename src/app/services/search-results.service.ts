import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PatientBundle } from '../bundle';
import { ResearchStudySearchEntry, SearchResultsBundle, SearchService } from './search.service';
import { StubSearchService } from './stub-search.service';
import { unpackResearchStudyResults } from '../export/parse-data';
import { exportTrials } from '../export/export-data';

import { environment } from '../../environments/environment';

/**
 * This defines the fields that can be searched on as defined by the clinical
 * trial search services. Two are required, two may be omitted.
 */
export interface TrialQuery {
  zipCode: string;
  travelRadius: number;
  phase?: string;
  recruitmentStatus?: string;
}

/**
 * This singleton service maintains the current active search, coordinating
 * loading the search between the search results page and the search page. It
 * also maintains the list of saved clinical trials.
 */
@Injectable({
  providedIn: 'root'
})
export class SearchResultsService {
  private _query: TrialQuery = null;
  private _results: SearchResultsBundle = null;
  /**
   * Saved clinical trials.
   */
  private savedClinicalTrials: ResearchStudySearchEntry[] = [];
  /**
   * The set of saved clinical trials by their internal index.
   */
  private savedClinicalTrialsIdices = new Set<number>();

  constructor(private searchService: SearchService) {
    if (environment.stubSearchResults) {
      this._query = {
        zipCode: '01730',
        travelRadius: 10
      };
      if (this.searchService instanceof StubSearchService) {
        // Grab the fake results
        this._results = this.searchService.createSearchResultsBundle();
      }
    }
  }

  get query(): TrialQuery {
    return this._query;
  }

  /**
   * Gets the number of saved clinical trials.
   */
  get savedCount(): number {
    return this.savedClinicalTrials.length;
  }

  getSavedTrial(index: number): ResearchStudySearchEntry {
    return this.savedClinicalTrials[index];
  }

  /**
   * For now, returns the entire results. Eventually pagination and caching will
   * possibly be moved here.
   * @returns the entire results
   */
  getResults(): SearchResultsBundle {
    return this._results;
  }

  /**
   * Gets a single result from within all results. If the result is entirely out of range, returns null.
   * @param idx the index of the result to get
   */
  getResult(idx: number): ResearchStudySearchEntry | null {
    if (this._results === null || idx < 0 || idx >= this._results.researchStudies.length) return null;
    return this._results.researchStudies[idx];
  }

  search(query: TrialQuery, patientBundle: PatientBundle): Observable<SearchResultsBundle> {
    this._query = query;
    // Forward to the actual service
    const observable = this.searchService.searchClinicalTrials(patientBundle);
    observable.subscribe((results) => {
      this._results = results;
    });
    return observable;
  }

  isTrialSaved(trial: ResearchStudySearchEntry | number): boolean {
    return this.savedClinicalTrialsIdices.has(typeof trial === 'number' ? trial : trial.index);
  }

  /**
   * Save or remove a trial from the saved trials list. Returns the new state of the trial: true is saved, false if
   * removed.
   */
  public toggleTrialSaved(trial: ResearchStudySearchEntry): boolean {
    const saved = !this.savedClinicalTrialsIdices.has(trial.index);
    this.setTrialSaved(trial, saved);
    return saved;
  }

  /**
   * Sets whether or not a given trial is part of the saved set.
   * @param trial the trial to set whether or not it is saved
   * @param saved the save state of the trial
   */
  public setTrialSaved(trial: ResearchStudySearchEntry, saved: boolean): void {
    if (saved) {
      if (!this.savedClinicalTrialsIdices.has(trial.index)) {
        // Need to add it
        this.savedClinicalTrials.push(trial);
        this.savedClinicalTrialsIdices.add(trial.index);
      }
    } else {
      if (this.savedClinicalTrialsIdices.has(trial.index)) {
        // Need to remove it
        const index = this.savedClinicalTrials.findIndex((t) => t.nctId === trial.nctId);
        this.savedClinicalTrials.splice(index, 1);
        this.savedClinicalTrialsIdices.delete(trial.index);
      }
    }
  }

  /**
   * Export the saved trials
   */
  public exportSavedTrials(): void {
    let data = [];
    if (this.savedClinicalTrials.length > 0) {
      data = unpackResearchStudyResults(this.savedClinicalTrials);
    } else {
      data = unpackResearchStudyResults(this._results.researchStudies);
    }
    exportTrials(data, 'clinicalTrials');
  }
}
