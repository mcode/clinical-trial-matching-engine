import { Component, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import Patient from '../patient';
import { fhirclient } from 'fhirclient/lib/types';

@Component({
  selector: 'app-record-data',
  templateUrl: './record-data.component.html',
  styleUrls: ['./record-data.component.css']
})
export class RecordDataComponent {
  @Input() patient: Patient;
  @Input() displayOn: boolean;
  @Input() bundleResources: fhirclient.FHIR.BundleEntry[];
  @Output() getDisplayChange = new EventEmitter<boolean>();

  conditions: fhirclient.FHIR.Resource[];
  observations: fhirclient.FHIR.Resource[];
  procedures: fhirclient.FHIR.Resource[];
  medications: fhirclient.FHIR.Resource[];
  otherResources: fhirclient.FHIR.Resource[];

  constructor(private cdRef: ChangeDetectorRef) {}

  ngAfterContentChecked(): void {
    this.cdRef.detectChanges();
  }

  setResources(): void {
    // Initialize.
    if (this.otherResources == undefined || this.otherResources == null) {
      this.otherResources = [] as fhirclient.FHIR.Resource[];
      this.conditions = [] as fhirclient.FHIR.Resource[];
      this.observations = [] as fhirclient.FHIR.Resource[];
      this.procedures = [] as fhirclient.FHIR.Resource[];
      this.medications = [] as fhirclient.FHIR.Resource[];
      const allResources: fhirclient.FHIR.Resource[] = this.bundleResources.map((br) => br.resource);

      // Pull the resource types and add to resource lists.
      for (const resource of allResources) {
        switch (resource.resourceType) {
          case 'Observation':
            this.observations.unshift(resource);
            break;
          case 'Condition':
            this.conditions.unshift(resource);
            break;
          case 'Procedure':
            this.procedures.unshift(resource);
            break;
          case 'MedicationStatement':
            this.medications.unshift(resource);
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

  setStatus(status: boolean): void {
    this.displayOn = status;
    this.getDisplayChange.emit(status);
  }

  // ngOnInit() {}
}
