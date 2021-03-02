import { TestBed } from '@angular/core/testing';

import * as FHIR from 'fhirclient';
import Client from 'fhirclient/lib/Client';
import { fhirclient } from 'fhirclient/lib/types';
import { promise } from 'protractor';

import { ClientService } from './client.service';

describe('ClientService', () => {
  let service: ClientService;
  let mockClient: Client;
  let mockPatient: fhirclient.FHIR.Patient;
  let fhirInitSpy: jasmine.Spy;
  let mockRequest: (url: string) => Promise<fhirclient.JsonObject>;
  let mockRequestResult: fhirclient.JsonObject;
  let mockError: Error | null;
  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ClientService);
    // getClient expects to invoke the FHIR OAUTH2 load but we don't want to
    // really create a client
    // Create a mock patient object
    mockPatient = ({} as unknown) as fhirclient.FHIR.Patient;
    // Set defaults for the mock request
    mockRequest = null;
    mockError = null;
    mockRequestResult = {};
    const request = (url: string): Promise<fhirclient.JsonObject> => {
      // If we've been given a mock request stub to use, use that
      if (mockRequest) {
        return mockRequest(url);
      }
      // Otherwise, return the configureed error or result
      if (mockError) {
        return Promise.reject(mockError);
      } else {
        return Promise.resolve(mockRequestResult);
      }
    };
    mockClient = ({
      patient: {
        read: () => Promise.resolve(mockPatient),
        request: request
      },
      request: request
    } as unknown) as Client;
    fhirInitSpy = spyOn(FHIR.oauth2, 'init').and.callFake(() => Promise.resolve(mockClient));
  });

  describe('#getClient', () => {
    it('gets the client', () => {
      const service: ClientService = TestBed.inject(ClientService);
      return expectAsync(service.getClient())
        .toBeResolvedTo(mockClient)
        .then(() => {
          // Should have been called once but with arguments we don't check
          expect(fhirInitSpy).toHaveBeenCalledTimes(1);
        });
    });

    it('resolves to the existing client if the client is already loaded', () => {
      // For this, insert the mock client as if it were already loaded
      // (the other option would be calling getClient() twice)
      service.client = mockClient;
      return expectAsync(service.getClient())
        .toBeResolvedTo(mockClient)
        .then(() => {
          expect(fhirInitSpy).not.toHaveBeenCalled();
        });
    });
  });

  describe('#getPatient', () => {
    it('should get the patient', () => {
      return expectAsync(service.getPatient()).toBeResolvedTo(mockPatient);
    });

    it('resolves to the existing patient if the patient is already loaded', () => {
      // For this, insert the mock patient as if it were already loaded
      // (the other option would be calling getPatient() twice)
      service.patient = mockPatient;
      return expectAsync(service.getPatient())
        .toBeResolvedTo(mockPatient)
        .then(() => {
          expect(fhirInitSpy).not.toHaveBeenCalled();
        });
    });
  });

  it('should get record', () => {
    return expectAsync(service.getRecords('')).toBeResolved();
  });

  describe('#getAllRecords()', () => {
    it('fetches multiple pages', () => {
      // For this we want to create two entries:
      const entry1: fhirclient.FHIR.Resource = {
        resourceType: 'Observation'
      };
      const entry2: fhirclient.FHIR.Resource = {
        resourceType: 'Encounter'
      };
      const expectedUrls = ['query', 'page2', 'page3'];
      const responses: fhirclient.JsonObject[] = [
        {
          entry: [entry1],
          link: [
            {
              relation: 'next',
              url: 'page2'
            }
          ]
        },
        // Just to be complete, include a page with no entry. Shouldn't happen, but whatever.
        {
          link: [
            {
              relation: 'previous',
              url: 'page1'
            },
            {
              relation: 'next',
              url: 'page3'
            }
          ]
        },
        {
          entry: [entry2],
          link: [
            {
              relation: 'previous',
              url: 'page2'
            }
          ]
        }
      ];
      // For this we need to take over the request to ensure we chain the two
      // responses.
      let responseIndex = 0;
      mockRequest = (url: string) => {
        expect(url).toEqual(expectedUrls[responseIndex]);
        const response = responses[responseIndex];
        responseIndex++;
        return Promise.resolve(response);
      };
      return expectAsync(service.getAllRecords('query')).toBeResolvedTo([entry1, entry2]);
    });
  });

  describe('#getConditions', () => {
    let expectedCondition: fhirclient.FHIR.Resource = {
      resourceType: 'Condition'
    };
    let getAllRecords: jasmine.Spy<(query: string) => Promise<fhirclient.FHIR.BackboneElement[]>>;
    beforeEach(() => {
      getAllRecords = spyOn(service, 'getAllRecords');
      getAllRecords.and.callFake(() =>
        Promise.resolve<fhirclient.FHIR.BundleEntry[]>([
          { fullUrl: 'http://www.example.com/condition/1', resource: expectedCondition }
        ])
      );
    });

    it('gets conditions without parameters', () => {
      return expectAsync(service.getConditions())
        .toBeResolvedTo([expectedCondition])
        .then(() => {
          expect(getAllRecords).toHaveBeenCalledOnceWith('Condition');
        });
    });

    it('adds query parameters', () => {
      return expectAsync(service.getConditions({ foo: 'bar', two: 2, bool: true, baz: null }))
        .toBeResolvedTo([expectedCondition])
        .then(() => {
          expect(getAllRecords).toHaveBeenCalledOnceWith('Condition?foo=bar&two=2&bool=true&baz=null');
        });
    });
  });

  describe('#getResources', () => {
    let expected: fhirclient.FHIR.BundleEntry[] = [
      {
        fullUrl: 'http://www.example.com/encounter/1',
        resource: {
          resourceType: 'Encounter'
        }
      }
    ];
    let getAllRecords: jasmine.Spy<(query: string) => Promise<fhirclient.FHIR.BackboneElement[]>>;
    beforeEach(() => {
      getAllRecords = spyOn(service, 'getAllRecords');
      getAllRecords.and.callFake(() => Promise.resolve<fhirclient.FHIR.BundleEntry[]>(expected));
    });

    it('gets resources without parameters', () => {
      return expectAsync(service.getResources('Encounter'))
        .toBeResolvedTo(expected)
        .then(() => {
          expect(getAllRecords).toHaveBeenCalledOnceWith('Encounter');
        });
    });

    it('adds query parameters', () => {
      return expectAsync(service.getResources('Encounter', { foo: 'bar', two: 2, bool: true, baz: null }))
        .toBeResolvedTo(expected)
        .then(() => {
          expect(getAllRecords).toHaveBeenCalledOnceWith('Encounter?foo=bar&two=2&bool=true&baz=null');
        });
    });
  });
});
