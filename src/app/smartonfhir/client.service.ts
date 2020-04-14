import { Injectable } from '@angular/core';

import * as FHIR from 'fhirclient';
import Client from 'fhirclient/lib/Client';
import { fhirclient } from 'fhirclient/lib/types';

type Patient = fhirclient.FHIR.Patient;

let client: Client;

/**
 * This provides a wrapper around the FHIR client. The FHIR client still needs
 * to be initialized.
 */
@Injectable({
  providedIn: 'root'
})
export class ClientService {
  client: Client;
  patient: Patient;
  constructor() { }
  getClient(): Promise<Client> {
    console.log('getting patient');
    // TODO: There is an edge case where the client is in the process of
    // resolving - there is an outstanding promise resolving the client.
    if (this.client) {
      return Promise.resolve(this.client);
    }
    console.log('starting FHIR Oauth');
    return FHIR.oauth2
      .init({
        clientId: 'Input client id you get when you register the app',
        scope: 'launch/patient openid profile'
      })
      .then(client => {
        console.log('got client');
        // Forward the client down the chain
        return this.client = client;
      });
  }
  /**
   * Gets the patient from the client. If the client has not be initialized,
   * also initializes the client.
   */
  getPatient(): Promise<Patient> {
    return new Promise((resolve, reject) => {
      // In order to reduce code complexity, just always use the client promise.
      // If the client has been initialized, it will immediately resolve anyway.
      this.getClient().then(client => {
        console.log('loading patient');
        client.patient.read().then(patient => {
          console.log('got patient');
          resolve(this.patient = patient);
        });
      }).catch(error => { console.error(error); reject(error); });
    });
  }
}
