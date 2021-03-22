/**
 * This version of the SMART on FHIR module loads a patient from static data.
 */
import { Injectable } from '@angular/core';

import { Bundle, Patient } from '../fhir-types';

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
  constructor() {}

  /**
   * Gets the patient from the client. If the client has not be initialized,
   * also initializes the client.
   */
  getPatient(): Promise<Patient> {
    return Promise.resolve(this.patient);
  }

  /**
   * Sets the patient to use.
   * @param bundle the bundle to get patient data from
   */
  setPatientBundle(bundle: Bundle): void {
    // Find the first entry that's a patient and use that.
    for (const entry of bundle.entry) {
      if (entry.resource && entry.resource.resourceType === 'Patient') {
        this.patient = entry.resource as Patient;
        return;
      }
    }
  }
}
