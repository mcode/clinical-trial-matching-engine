import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-trial-card',
  templateUrl: './trial-card.component.html',
  styleUrls: ['../app.component.css'] //refer to app component styling for the time being
})
export class TrialCardComponent implements OnInit {
  @Input() clinicalTrial: object;
  @Input() trialSaved: boolean = false;
  @Output() trialSaveChanged = new EventEmitter<boolean>();
  constructor() { }

  public toggleTrialSaved(): void {
    this.trialSaved = !this.trialSaved
    this.trialSaveChanged.emit(this.trialSaved);
  }

  public replace(value: string): string {
    return value.replace(/[\[\]_'""]+/g, ' ');
  }



  ngOnInit() {
  }

}