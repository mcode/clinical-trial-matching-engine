import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { SearchProvider } from './app-config.service';
import { SearchService, SearchResultsBundle } from './search.service';
import { DistanceService } from './distance.service';
import { Bundle } from '../fhir-types';
import { PatientBundle } from '../bundle';

@Injectable({
  providedIn: 'root'
})
export class StubSearchService extends SearchService {
  demoResults: Bundle = {
    resourceType: 'Bundle' as 'Bundle',
    type: 'searchset',
    entry: [
      {
        fullUrl: 'https://www.example.com/result/1',
        resource: {
          resourceType: 'ResearchStudy',
          identifier: [
            {
              use: 'official',
              system: 'http://clinicaltrials.gov',
              value: 'NCT12345678'
            }
          ],
          title: 'Demo Research Study',
          status: 'active',
          phase: {
            coding: 'phase-1',
            text: 'Phase 1'
          },
          condition: [
            {
              coding: {
                system: 'http://snomed.info/sct',
                code: '408643008',
                display: 'Infiltrating duct carcinoma of breast (disorder)'
              },
              text: 'Infiltrating duct carcinoma of breast (disorder)'
            }
          ],
          contact: [
            {
              name: 'Example Contact',
              telecom: [
                {
                  system: 'email',
                  value: 'contact@example.com'
                },
                {
                  system: 'phone',
                  value: '781-555-0100'
                }
              ]
            }
          ],
          sponsor: [
            {
              reference: '#organization1',
              type: 'Organization'
            }
          ],
          site: [
            {
              reference: '#site1',
              type: 'Location'
            }
          ],
          contained: [
            {
              resourceType: 'Location',
              id: 'site1',
              name: 'Demo Site 1',
              address: {
                use: 'work',
                type: 'physical',
                // One town over from stubbed patient
                postalCode: '01803'
              },
              telecom: [
                {
                  system: 'email',
                  value: 'site@example.com'
                },
                {
                  system: 'phone',
                  value: '781-555-0200'
                }
              ]
            },
            {
              resourceType: 'Organization',
              id: 'organization1',
              name: 'Demo Organization'
            }
          ]
        },
        search: {
          score: 0.96
        }
      },
      {
        fullUrl: 'https://www.example.com/result/2',
        resource: {
          resourceType: 'ResearchStudy',
          status: 'approved',
          phase: {
            coding: 'early-phase-1',
            text: 'Early Phase 1'
          },
          title: 'Likely Match'
        },
        search: {
          score: 0.334
        }
      },
      // This is an intentionally bare-bones result to test what happens with
      // almost nothing defined.
      {
        fullUrl: 'https://www.example.com/result/2',
        resource: {
          resourceType: 'ResearchStudy',
          status: 'active'
        },
        search: {
          score: 0.1
        }
      }
    ]
  };
  provider = new SearchProvider('Test Service', 'http://www.example.com/');
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
      observer.next(this.createSearchResultsBundle());
    });
  }

  createSearchResultsBundle(): SearchResultsBundle {
    return new SearchResultsBundle(this.demoResults, this.distService, '01730', this.provider);
  }
}
