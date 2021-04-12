import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PatientBundle } from '../bundle';
import { SearchResultsBundle, SearchService } from './search.service';

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
