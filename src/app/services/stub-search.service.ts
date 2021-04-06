import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { SearchService, SearchResultsBundle } from './search.service';
import { DistanceService } from './distance.service';
import { PatientBundle } from '../bundle';

@Injectable({
  providedIn: 'root'
})
export class StubSearchService extends SearchService {
  constructor(distService: DistanceService) {
    super(null, null, distService);
  }

  /**
   * Generates an observable that always returns the same results.
   * @param _patientBundle ignored
   * @param _offset ignored
   * @param _count ignored
   * @returns a static set of results
   */
  searchClinicalTrials(_patientBundle: PatientBundle, _offset?: number, _count = 10): Observable<SearchResultsBundle> {
    return new Observable<SearchResultsBundle>((observer) => {
      observer.next(
        new SearchResultsBundle(
          {
            resourceType: 'Bundle' as 'Bundle',
            type: 'searchset',
            entry: [
              {
                fullUrl: 'https://www.example.com/result/1',
                resource: {
                  resourceType: 'ResearchStudy',
                  status: 'active'
                }
              }
            ]
          },
          this.distService,
          '01730'
        )
      );
    });
  }
}
