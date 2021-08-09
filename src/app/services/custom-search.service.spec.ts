import { TestBed } from '@angular/core/testing';
import { TestScheduler } from 'rxjs/testing';

import { CustomSearchService } from './custom-search.service';
import { SNOMED_CODE_URI } from './snomed';

describe('CustomSearchService', () => {
  const testScheduler = new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected);
  });
  let service: CustomSearchService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    // For now, the custom search service loads codes directly as source. In the
    // future special test codes will likely be necessary.
    service = TestBed.inject(CustomSearchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('#findCancerConditions', () => {
    it('should find an exact match', () => {
      testScheduler.run((helpers) => {
        const { expectObservable } = helpers;
        expectObservable(service.findCancerConditions('Fibroadenoma')).toBe('(a|)', {
          a: {
            display: 'Fibroadenoma',
            primary: {
              coding: [
                {
                  system: SNOMED_CODE_URI,
                  code: '254845004',
                  display: 'Fibroadenoma of breast (disorder)'
                }
              ],
              text: 'Fibroadenoma of breast (disorder)'
            }
          }
        });
      });
    });
    it('should find substring matches (case insensitive)', () => {
      testScheduler.run((helpers) => {
        const { expectObservable } = helpers;
        expectObservable(service.findCancerConditions('fibro')).toBe('(ab|)', {
          a: {
            display: 'Breast Fibroepithelial Neoplasm',
            primary: {
              coding: [
                {
                  system: SNOMED_CODE_URI,
                  code: '372137005',
                  display: 'Primary malignant neoplasm of breast (disorder)'
                }
              ],
              text: 'Primary malignant neoplasm of breast (disorder)'
            },
            histology: {
              coding: [
                {
                  system: SNOMED_CODE_URI,
                  code: '43369006',
                  display: 'Basal cell carcinoma, fibroepithelial (morphologic abnormality)'
                }
              ],
              text: 'Basal cell carcinoma, fibroepithelial (morphologic abnormality)'
            }
          },
          b: {
            display: 'Fibroadenoma',
            primary: {
              coding: [
                {
                  system: SNOMED_CODE_URI,
                  code: '254845004',
                  display: 'Fibroadenoma of breast (disorder)'
                }
              ],
              text: 'Fibroadenoma of breast (disorder)'
            }
          }
        });
      });
    });
  });
});
