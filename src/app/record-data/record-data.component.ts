import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import Patient from '../patient';
import { BundleEntry, Condition, MedicationStatement, Observation, Procedure, Resource } from '../fhir-types';

@Component({
  selector: 'app-record-data',
  templateUrl: './record-data.component.html',
  styleUrls: ['./record-data.component.css']
})
export class RecordDataComponent {
  patient: Patient;
  _bundleResources: BundleEntry[];

  get bundleResources(): BundleEntry[] {
    return this._bundleResources;
  }
  set bundleResources(value: BundleEntry[]) {
    this._bundleResources = value;
    this.filterResources();
  }

  conditions: Condition[];
  observations: Observation[];
  procedures: Procedure[];
  medications: MedicationStatement[];
  otherResources: Resource[];

  constructor(@Inject(MAT_DIALOG_DATA) data: { patient: Patient; resources: BundleEntry[] }) {
    this.patient = data.patient;
    this.bundleResources = data.resources;
  }

  /**
   * Filter the resources into their given bundle.
   */
  private filterResources(): void {
    // Reset the various bins
    this.otherResources = [];
    this.conditions = [];
    this.observations = [];
    this.procedures = [];
    this.medications = [];

    // Pull the resource types and add to resource lists.
    for (const entry of this._bundleResources) {
      const resource = entry.resource;
      // Skip entries with no resources (shouldn't happen but technically allowed)
      if (!resource) continue;
      // The casts below are necessary because in theory the original resources within the bundle could be altered to
      // be a different type, which would break the types.
      switch (resource.resourceType) {
        case 'Observation':
          this.observations.unshift(resource as Observation);
          break;
        case 'Condition':
          this.conditions.unshift(resource as Condition);
          break;
        case 'Procedure':
          this.procedures.unshift(resource as Procedure);
          break;
        case 'MedicationStatement':
          this.medications.unshift(resource as MedicationStatement);
          break;
        default:
          if (resource.code != null && resource.code != undefined) {
            this.otherResources.unshift(resource);
          }
          break;
      }
    }
  }
}
