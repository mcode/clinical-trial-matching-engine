import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import * as FHIR from 'fhirclient';
import Client from 'fhirclient/lib/Client';
import { fhirclient } from 'fhirclient/lib/types';

type Patient = fhirclient.FHIR.Patient;

/**
 * Values that can be placed into parameters
 */
export type Stringable = string | number | boolean | null;

/**
 * Additional parameters to restrict a query. These are converted into a URL query string.
 */
export type QueryParameters = { [key: string]: Stringable };

/**
 * Converts a resourceType and optional query parameters to a FHIR query.
 * @param resourceType the resource type
 * @param parameters any optional query parameters
 */
export function createQuery(resourceType: string, parameters?: QueryParameters): string {
  let query = resourceType;
  if (parameters) {
    const params = [];
    for (const p in parameters) {
      params.push(
        encodeURIComponent(p) + '=' + encodeURIComponent(parameters[p] === null ? 'null' : parameters[p].toString())
      );
    }
    query += '?' + params.join('&');
  }
  return query;
}

export class AllRecordsChunk {
  constructor(public elements: fhirclient.FHIR.BackboneElement[], public total?: number) {}
}

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
   * @param resourceType the resource type to use
   * @param parameters the parameters to send
   */
  getAllRecords(resourceType: string, parameters?: QueryParameters): Observable<AllRecordsChunk> {
    let query = createQuery(resourceType, parameters);
    return new Observable((subscriber) => {
      this.getClient().then((client) => {
        const handlePage = (bundle): void => {
          if (bundle.entry) {
            // Fire off the event
            subscriber.next(new AllRecordsChunk(bundle.entry, bundle.total));
          }
          if (bundle.link) {
            // Look through the links to see if there's a next page
            for (const link of bundle.link) {
              if (link.relation === 'next') {
                // Have a next page link - so follow it and only the first one.
                client.request(link.url).then(handlePage, subscriber.error);
                return;
              }
            }
          }
          // If we've fallen through, we have no links, so just resolve with
          // whatever we have
          subscriber.complete();
          return;
        };
        client.patient.request(query).then(handlePage, subscriber.error);
      }, subscriber.error);
    });
  }
}
