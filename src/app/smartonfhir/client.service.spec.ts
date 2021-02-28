import { TestBed } from '@angular/core/testing';

import * as FHIR from 'fhirclient';
import Client from 'fhirclient/lib/Client';
import { fhirclient } from 'fhirclient/lib/types';
import { promise } from 'protractor';

import { ClientService } from './client.service';

describe('ClientService', () => {
  let mockClient: Client;
  let mockPatient: fhirclient.FHIR.Patient;
  let fhirInitSpy: jasmine.Spy;
  let mockRequestResult: fhirclient.JsonObject;
  let mockError: Error | null;
  beforeEach(() => {
    TestBed.configureTestingModule({});
    // getClient expects to invoke the FHIR OAUTH2 load but we don't want to
    // really create a client
    // Create a mock patient object
    mockPatient = ({} as unknown) as fhirclient.FHIR.Patient;
    // Set defaults for the mock request
    mockError = null;
    mockRequestResult = {};
    const request = (url: string): Promise<fhirclient.JsonObject> => {
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

  it('should be created', () => {
    const service: ClientService = TestBed.inject(ClientService);
    expect(service).toBeTruthy();
  });
  it('should get client', () => {
    const service: ClientService = TestBed.inject(ClientService);
    return expectAsync(service.getClient())
      .toBeResolved()
      .then(() => {
        // Should have been called once but with arguments we don't check
        expect(fhirInitSpy).toHaveBeenCalledTimes(1);
      });
  });
  it('should get the patient via the service', () => {
    const service: ClientService = TestBed.inject(ClientService);
    return expectAsync(service.getPatient()).toBeResolvedTo(mockPatient);
  });
  it('should get record', () => {
    const service: ClientService = TestBed.inject(ClientService);
    return expectAsync(service.getRecords('')).toBeResolved();
  });
  it('should get all records', () => {
    const service: ClientService = TestBed.inject(ClientService);
    return expectAsync(service.getAllRecords('')).toBeResolved();
  });
  it('should get conditions', () => {
    const service: ClientService = TestBed.inject(ClientService);
    return expectAsync(service.getConditions()).toBeResolved();
  });
  it('should get conditions w/ parameter', () => {
    const service: ClientService = TestBed.inject(ClientService);
    return expectAsync(service.getConditions({ id: 'example' })).toBeResolved();
  });
  it('should get resources', () => {
    const service: ClientService = TestBed.inject(ClientService);
    return expectAsync(service.getResources('')).toBeResolved();
  });
  it('should get resources w parameters', () => {
    const service: ClientService = TestBed.inject(ClientService);
    return expectAsync(service.getResources('', { id: 'example' })).toBeResolved();
  });
});
