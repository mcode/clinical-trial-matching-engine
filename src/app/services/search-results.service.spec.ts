import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SearchService } from './search.service';
import { SearchResultsService } from './search-results.service';
import { StubSearchService } from './stub-search.service';
import { PatientBundle } from '../bundle';

describe('SearchResultsService', () => {
  let httpTestingController: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        SearchResultsService,
        {
          provide: SearchService,
          useClass: StubSearchService
        }
      ]
    });

    httpTestingController = TestBed.inject(HttpTestingController);
  });

  it('filters PII in the submitted bundle', () => {
    const resultsService = TestBed.inject(SearchResultsService);
    const searchService = TestBed.inject(SearchService);
    // Spy on the search service - call through because the stub value returns sample data
    const spy = spyOn(searchService, 'searchClinicalTrials').and.callThrough();

    resultsService
      .search(
        {
          zipCode: '01730',
          travelRadius: 20
        },
        {
          resourceType: 'Bundle' as 'Bundle',
          type: 'searchset',
          entry: [
            {
              resource: {
                resourceType: 'Patient',
                name: [
                  {
                    use: 'official',
                    text: 'Testy McTestface',
                    family: 'McTestface',
                    given: ['Testy']
                  }
                ]
              }
            }
          ]
        }
      )
      .subscribe((result) => {
        expect(result).toBeDefined();
      });
    expect(spy).toHaveBeenCalledOnceWith({
      resourceType: 'Bundle' as 'Bundle',
      type: 'searchset',
      entry: [
        {
          resource: {
            resourceType: 'Patient',
            name: [
              {
                use: 'anonymous',
                text: 'Anonymous',
                family: 'Anonymous',
                given: ['Anonymous']
              }
            ]
          }
        }
      ]
    } as PatientBundle);
  });
});
