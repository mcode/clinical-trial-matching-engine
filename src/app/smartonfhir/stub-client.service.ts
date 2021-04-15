import * as FHIR from 'fhirclient';
import { ClientService, Stringable } from './client.service';
import { fhirclient } from 'fhirclient/lib/types';

/**
 * A stub service that does not actually contacted a FHIR server. It swaps out
 * all the items that run requests for things that return static data. Note that
 * the FHIR client is given a bogus URL, attempting to load things through it
 * directly WILL NOT WORK.
 */
export class StubClientService extends ClientService {
  constructor() {
    super();
    this.client = FHIR.client('https://www.example.com/disconnected');
    this.patient = {
      resourceType: 'Patient' as 'Patient',
      name: [
        {
          use: 'official',
          family: 'Patient',
          given: ['Demo']
        }
      ],
      address: [
        {
          use: 'home',
          postalCode: '01730'
        }
      ]
    };
  }
  /**
   * Wrapper around the FHIR client's patient.request method. Initializes the
   * client if necessary and then calls the patient.request method with the
   * given arguments.
   * @param requestOptions
   * @param fhirOptions
   */
  request(): Promise<fhirclient.JsonObject> {
    throw new Error('Not implemented');
  }
  /**
   * Always returns an empty searchset.
   */
  getRecords(_query: string, _pages = 1): Promise<fhirclient.JsonObject> {
    return Promise.resolve({
      resourceType: 'Bundle',
      type: 'searchset',
      entry: []
    });
  }
  /**
   * Always returns an empty array.
   */
  getAllRecords(_query: string): Promise<fhirclient.FHIR.BackboneElement[]> {
    return Promise.resolve([]);
  }
  /**
   * Always returns an empty array.
   */
  getResources(
    _resourceType: string,
    _parameters?: { [key: string]: Stringable }
  ): Promise<fhirclient.FHIR.BackboneElement[]> {
    return Promise.resolve([]);
  }
}
