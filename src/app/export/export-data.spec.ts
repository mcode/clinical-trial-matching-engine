import { UnpackResearchStudyResults } from './parse-data';
import { ResearchStudySearchEntry } from './../services/search.service';
import { DistanceService } from './../services/distance.service';
import { ExportTrials } from './export-data';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('export data', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DistanceService]
    })
  );
  it('should export data', () => {
    console.log('fffff');
    const distServ: DistanceService = TestBed.get(DistanceService);
    const actual = UnpackResearchStudyResults([
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
        '01886'
      )
    ]);
    console.log(ExportTrials([actual], 'sampleTrial'));
    expect(ExportTrials([actual], 'sampleTrial')).toBeUndefined();
  });
});
