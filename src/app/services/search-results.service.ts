import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PatientBundle } from '../bundle';
import { SearchResultsBundle, SearchService } from './search.service';
import { ResearchStudySearchEntry } from './ResearchStudySearchEntry';
import { unpackResearchStudyResults } from '../export/parse-data';
import { exportTrials } from '../export/export-data';

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
  protected _query: TrialQuery = null;
  private _results: SearchResultsBundle = null;
  /**
   * Saved clinical trials.
   */
  private savedClinicalTrials: ResearchStudySearchEntry[] = [];
  /**
   * The set of saved clinical trials by their internal ID.
   */
  private savedClinicalTrialsIdices = new Set<string>();
  private resultMap: Map<string, ResearchStudySearchEntry>;

  constructor(private searchService: SearchService) {}

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
   * Gets a single result from within all results based on its ID.
   * @param id the ID of the result to get
   */
  getResult(id: string): ResearchStudySearchEntry | undefined {
    if (!this._results) return undefined;
    return this.resultMap.get(id);
  }

  search(query: TrialQuery, patientBundle: PatientBundle): Observable<SearchResultsBundle> {
    this._query = query;
    // This is sort of silly but we need to ensure our observable is called first
    return new Observable<SearchResultsBundle>((subscriber) => {
      // Forward to the actual service
      const observable = this.searchService.searchClinicalTrials(patientBundle);
      observable.subscribe(
        (results) => {
          this.setResults(results);
          subscriber.next(results);
        },
        (error) => {
          subscriber.error(error);
        },
        () => {
          subscriber.complete();
        }
      );
    });
  }

  protected setResults(results: SearchResultsBundle): void {
    this._results = results;
    // Go through the results and map them
    this.resultMap = new Map<string, ResearchStudySearchEntry>();
    this._results.researchStudies.forEach((study) => {
      this.resultMap.set(study.id, study);
    });
  }

  isTrialSaved(trial: ResearchStudySearchEntry | string): boolean {
    return this.savedClinicalTrialsIdices.has(typeof trial === 'string' ? trial : trial.id);
  }

  /**
   * Save or remove a trial from the saved trials list. Returns the new state of the trial: true is saved, false if
   * removed.
   */
  public toggleTrialSaved(trial: ResearchStudySearchEntry): boolean {
    const saved = !this.savedClinicalTrialsIdices.has(trial.id);
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
      if (!this.savedClinicalTrialsIdices.has(trial.id)) {
        // Need to add it
        this.savedClinicalTrials.push(trial);
        this.savedClinicalTrialsIdices.add(trial.id);
      }
    } else {
      if (this.savedClinicalTrialsIdices.has(trial.id)) {
        // Need to remove it
        const index = this.savedClinicalTrials.findIndex((t) => t.nctId === trial.nctId);
        if (index >= 0) this.savedClinicalTrials.splice(index, 1);
        this.savedClinicalTrialsIdices.delete(trial.id);
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
