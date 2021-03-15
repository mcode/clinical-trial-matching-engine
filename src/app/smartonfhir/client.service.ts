/**
 * This version of the SMART on FHIR module loads a patient from static data.
 */
import { Injectable } from '@angular/core';

import { Patient } from '../fhir-types';

import patientData from '../../assets/patient1.json';

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
  // Provide a bit of stub data if there is no patient
  private patient: Patient = {
    resourceType: 'Patient' as 'Patient',
    name: [
      {
        use: 'official',
        family: 'Patient',
        given: ['Default']
      }
    ]
  };
  constructor() {
    // Find the first entry that's a patient and use that.
    for (const entry of patientData.entry) {
      if (entry.resource && entry.resource.resourceType === 'Patient') {
        this.patient = entry.resource as Patient;
        return;
      }
    }
  }
  /**
   * Gets the patient from the client. If the client has not be initialized,
   * also initializes the client.
   */
  getPatient(): Promise<Patient> {
    return Promise.resolve(this.patient);
  }
}
