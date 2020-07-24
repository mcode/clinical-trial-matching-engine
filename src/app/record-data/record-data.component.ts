import { Condition } from './../condition';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import Patient from '../patient';

@Component({
  selector: 'app-record-data',
  templateUrl: './record-data.component.html',
  styleUrls: ['./record-data.component.css']
})
export class RecordDataComponent {
  @Input() patient: Patient;
  @Input() displayOn: boolean;
  @Input() conditions: Condition[];
  @Output() getDisplayChange = new EventEmitter<boolean>();

  //constructor() { }

  setStatus(status: boolean): void {
    this.displayOn = status;
    this.getDisplayChange.emit(status);
  }
  // ngOnInit() {}
}
