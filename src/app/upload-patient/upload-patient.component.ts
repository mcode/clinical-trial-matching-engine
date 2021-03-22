import { Component } from '@angular/core';
import { FormControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';

import { ClientService } from '../smartonfhir/client.service';
import { Bundle, isBundle } from '../fhir-types';

@Component({
  selector: 'app-upload-patient',
  templateUrl: './upload-patient.component.html',
  styleUrls: ['./upload-patient.component.css']
})
export class UploadPatientComponent {
  // This is a demo patient
  patientBundle = `{
  "resourceType": "Bundle",
  "type": "searchset",
  "entry": [
    {
      "fullUrl": "urn:mcode:demoPatient",
      "resource": {
        "resourceType": "Patient",
        "id": "demoPatient",
        "name": [
          {
            "family": "Demo",
            "given": ["Patient", "X"]
          }
        ]
      },
      "request": {
        "method": "POST",
        "url": "Patient"
      }
    }
  ]
}`;
  patientBundleFormControl = new FormControl(this.patientBundle, (control): ValidationErrors | null => {
    try {
      const bundle = JSON.parse(control.value);
      if (!isBundle(bundle)) {
        return { bundle: 'Invalid data in JSON object: not a patient bundle' };
      }
      return null;
    } catch (ex) {
      return { json: 'JSON parsing failed: ' + ex.toString() };
    }
  });

  constructor(private router: Router, private fhirService: ClientService) {}

  getErrorMessage(): string {
    if (this.patientBundleFormControl.hasError('json')) {
      return this.patientBundleFormControl.getError('json');
    } else if (this.patientBundleFormControl.hasError('bundle')) {
      return this.patientBundleFormControl.getError('bundle');
    } else {
      return '';
    }
  }

  /**
   * Attempts to get the patient data as a bundle. This will throw an exception
   * if the patient data is invalid.
   */
  getPatientBundle(): Bundle {
    const bundle = JSON.parse(this.patientBundleFormControl.value);
    if (isBundle(bundle)) {
      return bundle;
    } else {
      throw new Error('Invalid patient data');
    }
  }

  /**
   * Attempts to upload the patient
   */
  uploadPatient(): void {
    this.fhirService.setPatientBundle(this.getPatientBundle());
    this.router.navigateByUrl('/search').catch((ex) => {
      console.log('Navigation failed');
      console.log(ex);
    });
  }
}
