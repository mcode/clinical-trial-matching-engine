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
  otherResources: fhirclient.FHIR.Resource[];

  constructor(private cdRef:ChangeDetectorRef){
  } 

  ngAfterContentChecked() {
     this.cdRef.detectChanges();
  }

  setResources(){
    // Initialize.
    if(this.otherResources == undefined || this.otherResources == null){
      this.otherResources = [] as fhirclient.FHIR.Resource[];
      this.conditions = [] as fhirclient.FHIR.Resource[];
      this.observations = [] as fhirclient.FHIR.Resource[];
      this.procedures = [] as fhirclient.FHIR.Resource[];
      const allResources: fhirclient.FHIR.Resource[] = this.bundleResources.map((br) => br.resource);

      // Pull the resource types and add to resource lists.
      for(const resource of allResources){
        switch(resource.resourceType){
          case 'Observation':
            this.observations.push(resource);
            break;
          case 'Condition':
            this.conditions.push(resource);
            break;
          case 'Procedure':
            this.procedures.push(resource);
            break;
          default:
            this.otherResources.push(resource);
            break;
        }
      }
      console.log("resources set");
    }
  }

  setStatus(status: boolean): void {
    this.displayOn = status;
    this.getDisplayChange.emit(status);
  }

  // ngOnInit() {}
}
