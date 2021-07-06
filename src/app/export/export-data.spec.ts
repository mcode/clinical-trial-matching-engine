import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import * as FileSaver from 'file-saver';

import { unpackResearchStudyResults } from './parse-data';
import { ResearchStudySearchEntry } from '../services/ResearchStudySearchEntry';
import { DistanceService } from '../services/distance.service';
import { exportTrials } from './export-data';

describe('export data', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DistanceService]
    })
  );

  it('should export data', () => {
    const distServ: DistanceService = TestBed.inject(DistanceService);
    const actual = unpackResearchStudyResults([
      new ResearchStudySearchEntry(
        {
          fullUrl: 'http://www.example.com/',
          resource: {
            resourceType: 'ResearchStudy',
            id: 'ID',
            title: 'Example Research Study',
            description: 'A test research study object for testing this feature.',
            identifier: [
              {
                use: 'official',
                system: 'http://clinicaltrials.gov',
                value: 'EXAMPLE'
              }
            ],
            status: 'active',
            phase: {
              coding: [
                {
                  system: 'http://terminology.hl7.org/CodeSystem/research-study-phase',
                  code: 'active',
                  display: 'Active'
                }
              ],
              text: 'Active'
            },
            category: [{ text: 'Example Category' }],
            contact: [
              {
                name: 'Example Contact',
                telecom: [
                  {
                    system: 'phone',
                    value: '781-555-0100',
                    use: 'work'
                  },
                  {
                    system: 'email',
                    value: 'email@example.com',
                    use: 'work'
                  }
                ]
              }
            ],
            enrollment: [
              {
                reference: '#group1',
                type: 'Group',
                display: 'Example Criteria'
              }
            ],
            sponsor: {
              reference: '#org1',
              type: 'Organization'
            },
            contained: [
              {
                resourceType: 'Group',
                id: 'group1',
                type: 'person',
                actual: false
              },
              {
                resourceType: 'Organization',
                id: 'org1',
                name: 'Example Sponsor Organization'
              },
              {
                resourceType: 'Location',
                id: 'location-1',
                name: 'First Location',
                telecom: [
                  {
                    system: 'phone',
                    value: '123456789',
                    use: 'work'
                  }
                ]
              },
              {
                resourceType: 'Location',
                id: 'location-2',
                name: 'Second Location',
                telecom: [
                  {
                    system: 'email',
                    value: 'email@example.com',
                    use: 'work'
                  }
                ]
              }
            ],
            site: [
              {
                reference: '#location-1',
                type: 'Location'
              },
              {
                reference: '#location-2',
                type: 'Location'
              }
            ]
          }
        },
        distServ,
        '01886',
        'example source'
      )
    ]);
    const spy = spyOn(FileSaver, 'saveAs');
    // Do the export
    exportTrials([actual], 'sampleTrial');
    // TODO: What should it have been called with?
    expect(spy.calls.count()).toEqual(1);
    const calledWith = spy.calls.argsFor(0);
    // Can't really check what the blob is, but expect it to be one
    expect(calledWith[0] instanceof Blob).toBe(true);
    expect(calledWith[1]).toEqual('sampleTrial.xlsx');
  });
});
