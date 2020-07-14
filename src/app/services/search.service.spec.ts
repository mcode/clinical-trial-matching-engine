import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ResearchStudySearchEntry, SearchService } from './search.service';

describe('SearchService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [HttpClientTestingModule],
    providers: [SearchService]
  }));

  it('should be created', () => {
    const service: SearchService = TestBed.get(SearchService);
    expect(service).toBeTruthy();
  });
});

describe('ResearchStudySearchEntry', () => {
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
    const result = new ResearchStudySearchEntry(testEntry);
    const location = result.lookupContainedResource('location-1');
    expect(location).toBe(testEntry.resource.contained[1]);
  });

  it('getSites finds all sites', () => {
    const result = new ResearchStudySearchEntry(testEntry);
    const sites = result.getSites();
    expect(Array.isArray(sites)).toBe(true);
    expect(sites.length).toBe(2);
    expect(sites[0]).toBe(testEntry.resource.contained[1]);
    expect(sites[1]).toBe(testEntry.resource.contained[2]);
  });

  it('maps values as expected', () => {
    const result = new ResearchStudySearchEntry(testEntry);
    const sites = result.sites;
    expect(Array.isArray(sites)).toBe(true);
    expect(sites.length).toBe(2);
    expect(sites[0].facility).toEqual('First Location');
    expect(sites[1].facility).toEqual('Second Location');
    expect(sites[1].contactEmail).toEqual('email@example.com');
  });

  it('converts values as expected', () => {
    const result = new ResearchStudySearchEntry(testEntry);
    expect(result.overallContact).toEqual('Example Contact');
  });
});
