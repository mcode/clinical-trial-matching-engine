import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { SearchProvider } from './app-config.service';
import { DistanceService } from './distance.service';
import { SearchResultsBundle } from './search.service';
import { ResearchStudySearchEntry } from './ResearchStudySearchEntry';

describe('ResearchStudySearchEntry', () => {
  let distServ: DistanceService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DistanceService]
    });
    distServ = TestBed.inject(DistanceService);
  });

  const testEntry = {
    fullUrl: 'http://localhost/',
    resource: {
      resourceType: 'ResearchStudy',
      id: '1',
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
      category: [
        {
          text: 'Study Type: Study Type'
        },
        {
          text: 'Intervention Model: Intervention Model'
        },
        {
          text: 'Primary Purpose: Primary Purpose'
        },
        {
          text: 'Masking: Masking'
        }
      ],
      arm: [
        {
          name: 'Arm',
          type: {
            text: 'Experimental'
          },
          description: 'Description'
        }
      ],
      protocol: [
        {
          reference: '#plan-0',
          type: 'PlanDefinition'
        }
      ],
      contained: [
        {
          resourceType: 'Organization',
          id: 'org1',
          name: 'First Organization'
        },
        {
          resourceType: 'Location',
          id: 'location-1',
          name: 'First Location'
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
        },
        {
          resourceType: 'PlanDefinition',
          id: 'plan-0',
          title: 'Title',
          status: 'unknown',
          type: { text: 'Drug' },
          subjectCodeableConcept: { text: 'Arm' },
          subtitle: 'Other Name'
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
  };
  const testEntry2 = {
    fullUrl: 'http://localhost/',
    resource: {
      resourceType: 'ResearchStudy',
      id: '1',
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
          reference: '#group-1'
        }
      ],
      contained: [
        {
          resourceType: 'Organization',
          id: 'org1',
          name: 'First Organization'
        },
        {
          resourceType: 'Location',
          id: 'location-1',
          name: 'First Location',
          position: {
            latitude: 13.5,
            longitude: 37.7
          }
        },
        {
          resourceType: 'Group',
          id: 'group-1',
          name: 'First Group',
          characteristic: [
            { exclude: true, code: { text: 'example exc' }, valueCodeableConcept: { text: 'exclude' } },
            { exclude: false, code: { text: 'example inc' }, valueCodeableConcept: { text: 'include' } }
          ]
        },
        {
          resourceType: 'Location',
          id: 'location-2',
          name: 'Second Location',
          position: {
            latitude: 33.5,
            longitude: 27.7
          },
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
  };
  it('finds contained resources by id', () => {
    const result = new ResearchStudySearchEntry(testEntry, distServ, '01886', 'example source');
    const location = result.lookupContainedResource('location-1');
    expect(location).toBe(testEntry.resource.contained[1]);
  });

  it('getSites finds all sites', () => {
    const result = new ResearchStudySearchEntry(testEntry, distServ, '01886', 'example source');
    const sites = result.getSites();
    expect(Array.isArray(sites)).toBe(true);
    expect(sites.length).toBe(2);
    expect(sites[0]).toBe(testEntry.resource.contained[1]);
    expect(sites[1]).toBe(testEntry.resource.contained[2]);
  });

  it('maps values as expected', () => {
    const result = new ResearchStudySearchEntry(testEntry, distServ, '01886', 'example source');
    const sites = result.sites;
    expect(Array.isArray(sites)).toBe(true);
    expect(sites.length).toBe(2);
    expect(sites[0].facility).toEqual('First Location');
    expect(sites[1].facility).toEqual('Second Location');
    expect(sites[1].contactEmail).toEqual('email@example.com');
  });

  it('converts values as expected', () => {
    const result = new ResearchStudySearchEntry(testEntry, distServ, '01886', 'example source');
    expect(result.overallContact).toEqual('Example Contact');
  });

  it('closest site is null when no coordinate info', () => {
    const result = new ResearchStudySearchEntry(testEntry, distServ, '01886', 'example source');
    expect(result.getClosest('01886')).toBeNull();
  });
  it('closest site is null when no zip entered', () => {
    const result = new ResearchStudySearchEntry(testEntry, distServ, '01886', 'example source');
    expect(result.getClosest('')).toBeNull();
  });

  it('gets match likelihood as null when missing', () => {
    const result = new ResearchStudySearchEntry(testEntry, distServ, '01886', 'example source');
    expect(result.matchLikelihood).toBeNull();
  });
  it('gets match likelihood as expected', () => {
    const result = new ResearchStudySearchEntry(testEntry, distServ, '01886', 'example source');
    result.search = { mode: 'match', score: 0.3 };
    result.search.score = 0.23;
    expect(result.matchLikelihood).toBe('No Match');
    result.search.score = 0.56;
    expect(result.matchLikelihood).toBe('Possible Match');
    result.search.score = 0.96;
    expect(result.matchLikelihood).toBe('Likely Match');
  });
  it('gets description as unknown when missing', () => {
    const result = new ResearchStudySearchEntry(testEntry, distServ, '01886', 'example source');
    expect(result.description).toBe('(unknown)');
  });
  it('gets phase as unknown when missing', () => {
    const result = new ResearchStudySearchEntry(testEntry, distServ, '01886', 'example source');
    expect(result.phase).toBe('(unknown)');
  });
  it('gets contact name', () => {
    const result = new ResearchStudySearchEntry(testEntry, distServ, '01886', 'example source');
    expect(result.overallContact).toBe('Example Contact');
  });
  it('gets sponsor as none when missing', () => {
    const result = new ResearchStudySearchEntry(testEntry, distServ, '01886', 'example source');
    expect(result.sponsor).toBe('(None)');
  });
  it('gets criteria as blank string when missing', () => {
    const result = new ResearchStudySearchEntry(testEntry, distServ, '01886', 'example source');
    expect(result.criteria).toBe('');
  });
  it('gets nctId as undefined when missing', () => {
    const result = new ResearchStudySearchEntry(testEntry, distServ, '01886', 'example source');
    expect(result.nctId).toBeUndefined();
  });
  it('gets distance as undefined when no distance', () => {
    const result = new ResearchStudySearchEntry(testEntry, distServ, '01886', 'example source');
    expect(result.distance).toBeUndefined();
  });
  it('calculates/outputs closest distance properly', () => {
    const result = new ResearchStudySearchEntry(testEntry2, distServ, '01886', 'example source');
    expect(result.getClosest('01886')).toBeDefined();
  });
  it('gets criteria', () => {
    const result = new ResearchStudySearchEntry(testEntry2, distServ, '01886', 'example source');
    expect(result.criteria).toBeDefined();
  });
  it('gets study design', () => {
    const result = new ResearchStudySearchEntry(testEntry, distServ, '01886', 'example source');
    expect(result.studyDesign).toBeDefined();
  });
  it('gets arms and interventions', () => {
    const result = new ResearchStudySearchEntry(testEntry, distServ, '01886', 'example source');
    expect(result.arm).toBeDefined();
    expect(result.arm).toBeDefined();
    expect(result.arm).toHaveSize(1);
    expect(result.arm[0]).toEqual(
      jasmine.objectContaining({
        display: 'Experimental: Arm',
        description: 'Description',
        interventions: jasmine.arrayContaining([
          jasmine.objectContaining({
            title: 'Title',
            type: 'Drug',
            subtitle: 'Other Name'
          })
        ])
      })
    );
  });
  it('gets protocol', () => {
    const result = new ResearchStudySearchEntry(testEntry, distServ, '01886', 'example source');
    expect(result.protocol).toBeDefined();
  });
  it('gets arms', () => {
    const result = new ResearchStudySearchEntry(testEntry, distServ, '01886', 'example source');
    expect(result.arms).toBeDefined();
  });
  it('makes search results bundle', () => {
    const bundleData = {
      resourceType: 'Bundle' as 'Bundle',
      type: 'document' as 'document',
      link: [],
      entry: [testEntry2]
    };
    const bundle = new SearchResultsBundle(bundleData, distServ, '01886', new SearchProvider('example source', ''));
    expect(bundle).toBeDefined();
  });
  it('builds filters', () => {
    const bundleData = {
      resourceType: 'Bundle' as 'Bundle',
      type: 'document' as 'document',
      link: [],
      entry: [testEntry2]
    };
    const bundle = new SearchResultsBundle(bundleData, distServ, '01886', new SearchProvider('example source', ''));
    expect(bundle.buildFilters('id')).toBeDefined();
  });
  it('builds array filters', () => {
    const bundleData = {
      resourceType: 'Bundle' as 'Bundle',
      type: 'document' as 'document',
      link: [],
      entry: [testEntry]
    };
    const bundle = new SearchResultsBundle(bundleData, distServ, '01886', new SearchProvider('example source', ''));
    expect(bundle.buildFilters('category', true, 'text', 'Intervention Model')).toBeDefined();
  });
});
