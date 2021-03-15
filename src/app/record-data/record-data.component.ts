import { Component, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import Patient from '../patient';
import { BundleEntry, Resource } from '../fhir-types';

@Component({
  selector: 'app-record-data',
  templateUrl: './record-data.component.html',
  styleUrls: ['./record-data.component.css']
})
export class RecordDataComponent {
  @Input() patient: Patient;
  @Input() displayOn: boolean;
  @Input() bundleResources: BundleEntry[];
  @Output() getDisplayChange = new EventEmitter<boolean>();

  conditions: Resource[];
  observations: Resource[];
  procedures: Resource[];
  medications: Resource[];
  otherResources: Resource[];

  constructor(private cdRef: ChangeDetectorRef) {}

  ngAfterContentChecked(): void {
    this.cdRef.detectChanges();
  }

  setResources(): void {
    // Initialize.
    if (this.otherResources == undefined || this.otherResources == null) {
      this.otherResources = [] as Resource[];
      this.conditions = [] as Resource[];
      this.observations = [] as Resource[];
      this.procedures = [] as Resource[];
      this.medications = [] as Resource[];
      const allResources: Resource[] = this.bundleResources.map((br) => br.resource);

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
