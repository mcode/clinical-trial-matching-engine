import { Injectable } from '@angular/core';

import * as FHIR from 'fhirclient';
import Client from 'fhirclient/lib/Client';
import { fhirclient } from 'fhirclient/lib/types';

type Patient = fhirclient.FHIR.Patient;

/**
 * Values that can be placed into parameters
 */
type Stringable = string | number | boolean | null;

/**
 * This provides a wrapper around the FHIR client.
 */
@Injectable({
  providedIn: 'root'
})
export class ClientService {
  client: Client;
  patient: Patient;
  private pendingClient: Promise<Client> | null = null;
  public resourceTypes = ['Patient', 'Condition', 'MedicationStatement', 'Observation', 'Procedure'];
  // Setting filters to pull only resources of relevant mcode profiles
  // {'_profile:below': 'http://hl7.org/fhir/us/mcode'} this should work for all the resource types but it doesn't and I don't know why, so we're listing profiles - maybe the moonshot fhir server doesn't implement 'below' as a search modifier
  // Note: did not include all observation mcode profiles
  public resourceParams = {
    Patient: {},
    Condition: {
      'clinical-status': 'active',
      _profile:
        'http://hl7.org/fhir/us/mcode/StructureDefinition/obf-ComorbidCondition,http://hl7.org/fhir/us/mcode/StructureDefinition/mcode-primary-cancer-condition,http://hl7.org/fhir/us/mcode/StructureDefinition/mcode-secondary-cancer-condition'
    },
    MedicationStatement: {
      _profile: 'http://hl7.org/fhir/us/mcode/StructureDefinition/mcode-cancer-related-medication-statement,'
    },
    Observation: {
      _profile:
        ' http://hl7.org/fhir/us/mcode/StructureDefinition/onco-core-CancerDiseaseStatus,http://hl7.org/fhir/us/mcode/StructureDefinition/mcode-tnm-clinical-stage-group,http://hl7.org/fhir/us/mcode/StructureDefinition/mcode-tnm-pathological-stage-group,http://hl7.org/fhir/us/mcode/StructureDefinition/mcode-tumor-marker'
    },
    Procedure: {
      _profile:
        'http://hl7.org/fhir/us/mcode/StructureDefinition/mcode-cancer-related-radiation-procedure,http://hl7.org/fhir/us/mcode/StructureDefinition/mcode-cancer-related-surgical-procedure'
    }
  };
  /**
   * Gets a Promise that resolves to the client when the client is ready. If
   * the client is already ready, this returns a resolved Promise.
   */
  getClient(): Promise<Client> {
    if (this.client) {
      return Promise.resolve(this.client);
    }
    if (this.pendingClient !== null) {
      return this.pendingClient;
    }
    return (this.pendingClient = FHIR.oauth2
      .init({
        clientId: 'Input client id you get when you register the app',
        scope: 'launch/patient openid profile'
      })
      .then((client) => {
        // Don't hold on to the promise
        this.pendingClient = null;
        // Forward the client down the chain
        return (this.client = client);
      }));
  }
  /**
   * Gets the patient from the client. If the client has not be initialized,
   * also initializes the client.
   */
  getPatient(): Promise<Patient> {
    if (this.patient) {
      return Promise.resolve(this.patient);
    }
    // In order to reduce code complexity, just always use the client promise.
    // If the client has been initialized, it will immediately resolve anyway.
    return this.getClient().then((client) => {
      // Returning a Promise in a Promise causes the new Promise to resolve to
      // that Promise - so effectively our returned Promise resolves (through
      // the then here) to the patient.
      return client.patient.read().then((patient) => (this.patient = patient));
    });
  }
  /**
   * Wrapper around the FHIR client's patient.request method. Initializes the
   * client if necessary and then calls the patient.request method with the
   * given arguments.
   * @param requestOptions
   * @param fhirOptions
   */
  request(
    requestOptions: string | URL | fhirclient.RequestOptions,
    fhirOptions?: fhirclient.FhirOptions
  ): Promise<fhirclient.JsonObject> {
    return this.getClient().then((client) => client.patient.request(requestOptions, fhirOptions));
  }
  /**
   * Gets records from the current patient. There may be multiple pages of
   * results returned, to get multiple at once, set the page limit to be higher
   * than 1.
   * @param query the FHIR query to run
   */
  getRecords(query: string, pages = 1): Promise<fhirclient.JsonObject> {
    return this.request(query, { flat: true, pageLimit: pages });
  }
  /**
   * Fetches ALL records, continuing to send requests until all pages are
   * fetched. To get records with a limit, use getRecords with a limited number
   * of pages.
   * @param query the type of FHIR record to fetch
   */
  getAllRecords(query: string): Promise<fhirclient.FHIR.BackboneElement[]> {
    return new Promise((resolve, reject) => {
      this.getClient()
        .then((client) => {
          // Here is where the 'magic' happens
          const results: fhirclient.FHIR.BackboneElement[] = [];
          const handlePage = (bundle): void => {
            if (bundle.entry) {
              // Append these entries to the list - entry is conceptually optional,
              // so make sure it exists before appending
              // (Concat creates a new array, this pushes the results onto the end)
              Array.prototype.push.apply(results, bundle.entry);
            }
            if (bundle.link) {
              // Look through the links to see if there's a next page
              for (const link of bundle.link) {
                if (link.relation === 'next') {
                  // Have a next page link - so follow it and only the first one.
                  client.request(link.url).then(handlePage).catch(reject);
                  return;
                }
              }
            }
            // If we've fallen through, we have no links, so just resolve with
            // whatever we have
            resolve(results);
            return;
          };
          client.patient.request(query).then(handlePage).catch(reject);
        })
        .catch(reject);
    });
  }
  /**
   * Gets all conditions from the client.
   */
  getConditions(parameters?: { [key: string]: Stringable }): Promise<fhirclient.FHIR.Resource[]> {
    let query = 'Condition';
    if (parameters) {
      const params = [];
      for (const p in parameters) {
        params.push(
          encodeURIComponent(p) + '=' + encodeURIComponent(parameters[p] === null ? 'null' : parameters[p].toString())
        );
      }
      query += '?' + params.join('&');
    }
    // Resources should all be BundleEntries
    return this.getAllRecords(query).then((resources) =>
      resources.map((resource) => (resource as fhirclient.FHIR.BundleEntry).resource)
    );
  }
  /**
   * Gets all resources of queryType from the client.
   */
  getResources(
    queryType: string,
    parameters?: { [key: string]: Stringable }
  ): Promise<fhirclient.FHIR.BackboneElement[]> {
    let query = queryType;
    if (parameters) {
      const params = [];
      for (const p in parameters) {
        params.push(
          encodeURIComponent(p) + '=' + encodeURIComponent(parameters[p] === null ? 'null' : parameters[p].toString())
        );
      }
      query += '?' + params.join('&');
    }
    //console.log(query);
    // Resources should all be BundleEntries
    return this.getAllRecords(query);
  }
}
