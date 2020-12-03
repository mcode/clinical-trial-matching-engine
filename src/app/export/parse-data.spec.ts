import { DistanceService } from './../services/distance.service';
import { TestBed } from '@angular/core/testing';
import { UnpackResearchStudyResults } from './parse-data';
import { ResearchStudySearchEntry } from '../services/search.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('UnpackResearchStudyResults', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DistanceService]
    })
  );

  it('works on an empty array', () => {
    const actual = UnpackResearchStudyResults([]);
    expect(Array.isArray(actual)).toBe(true);
    expect(actual.length).toEqual(1);
    expect('Match Count' in actual[0]).toBe(true);
    expect(actual[0]['Match Count']).toEqual(0);
  });

  it('works on an almost empty ResearchStudy', () => {
    const distServ = TestBed.get(DistanceService);
    const actual = UnpackResearchStudyResults([
      new ResearchStudySearchEntry(
        {
          fullUrl: 'http://www.example.com/',
          resource: {
            resourceType: 'ResearchStudy'
          }
        },
        distServ,
        '01886'
      )
    ]);
    expect(Array.isArray(actual)).toBe(true);
    expect(actual.length).toEqual(2);
    expect('Match Count' in actual[0]).toBe(true);
    expect(actual[0]['Match Count']).toEqual(1);
  });

  it('exports sites', () => {
    const distServ = TestBed.get(DistanceService);
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
    expect(Array.isArray(actual)).toBe(true);
    expect(actual.length).toEqual(4);
    expect('Match Count' in actual[0]).toBe(true);
    expect(actual[0]['Match Count']).toEqual(1);
    const row = actual[1];
    expect('nctId' in row).toBe(true);
    expect(row['nctId']).toEqual('EXAMPLE');
    expect('Title' in row).toBe(true);
    expect(row['Title']).toEqual('Example Research Study');
    expect('OverallStatus' in row).toBe(true);
    expect(row['OverallStatus']).toEqual('active');
    expect('Phase' in row).toBe(true);
    expect(row['Phase']).toEqual('Active');
    // FIXME: Handle conditions better
    expect('Conditions' in row).toBe(true);
    expect(row['Conditions']).toEqual('[]');
    expect('StudyType' in row).toBe(true);
    expect(row['StudyType']).toEqual('Example Category');
    expect('Description' in row).toBe(true);
    expect(row['Description']).toEqual('A test research study object for testing this feature.');
    expect('DetailedDescription' in row).toBe(true);
    expect(row['DetailedDescription']).toEqual('A test research study object for testing this feature.');
    expect('Criteria' in row).toBe(true);
    expect(row['Criteria']).toEqual('Example Criteria');
    expect('Sponsor' in row).toBe(true);
    expect(row['Sponsor']).toEqual('Example Sponsor Organization');
    expect('OverallContact' in row).toBe(true);
    expect(row['OverallContact']).toEqual('Example Contact');
    expect('OverallContactPhone' in row).toBe(true);
    expect(row['OverallContactPhone']).toEqual('781-555-0100');
    expect('OverallContactEmail' in row).toBe(true);
    expect(row['OverallContactEmail']).toEqual('email@example.com');
  });
});
