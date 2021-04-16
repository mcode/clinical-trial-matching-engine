import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PatientBundle } from '../bundle';
import { ResearchStudySearchEntry, SearchResultsBundle, SearchService } from './search.service';

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
 * loading the search between the search results page and the search page.
 */
@Injectable({
  providedIn: 'root'
})
export class SearchResultsService {
  private _query: TrialQuery = null;
  private _results: SearchResultsBundle = null;
  constructor(private searchService: SearchService) {}

  get query(): TrialQuery {
    return this._query;
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
}
