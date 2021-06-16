import { AppConfigService } from './app-config.service';
import { DistanceService } from './distance.service';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SearchService } from './search.service';

describe('SearchService', () => {
  let httpTestingController: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        SearchService,
        DistanceService,
        {
          provide: AppConfigService,
          useValue: new AppConfigService([{ name: 'TestService', url: 'https://www.example.com' }])
        }
      ]
    });

    httpTestingController = TestBed.inject(HttpTestingController);
  });

  it('posts the given bundle', () => {
    const service = TestBed.inject(SearchService);

    service
      .searchClinicalTrials({
        resourceType: 'Bundle' as 'Bundle',
        type: 'searchset',
        entry: [
          {
            resource: {
              resourceType: 'Patient'
            }
          }
        ]
      })
      .subscribe((result) => {
        expect(result).toBeDefined();
        expect(result.totalCount).toEqual(0);
      });
    const request = httpTestingController.expectOne('https://www.example.com/getClinicalTrial');
    expect(request.request.method).toEqual('POST');
    // Return an empty bundle
    request.flush({
      resourceType: 'Bundle',
      type: 'searchset',
      total: 0,
      entry: []
    });
    httpTestingController.verify();
  });
});
