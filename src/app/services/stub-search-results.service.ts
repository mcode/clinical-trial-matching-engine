import { Injectable } from '@angular/core';

import { SearchResultsService } from './search-results.service';
import { SearchService } from './search.service';
import { StubSearchService } from './stub-search.service';

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
 * Test mock version of the search results service.
 */
@Injectable({
  providedIn: 'root'
})
export class StubSearchResultsService extends SearchResultsService {
  constructor(searchService: SearchService) {
    super(searchService);
    this._query = {
      zipCode: '01730',
      travelRadius: 10
    };
    if (searchService instanceof StubSearchService) {
      // Grab the fake results
      this.setResults(searchService.createSearchResultsBundle());
    }
  }
}
