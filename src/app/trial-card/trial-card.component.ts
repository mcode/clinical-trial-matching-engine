import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-trial-card',
  templateUrl: './trial-card.component.html',
  styleUrls: ['../app.component.css'] //refer to app component styling for the time being
})
export class TrialCardComponent {
  @Input() clinicalTrial: object;
  @Input() trialSaved;
  @Output() trialSaveChanged = new EventEmitter<boolean>();
  //constructor() { }

  public toggleTrialSaved(): void {
    this.trialSaved = !this.trialSaved;
    this.trialSaveChanged.emit(this.trialSaved);
  }

  public replace(value: string): string {
    return value.replace(/[\[\]_'""]+/g, ' ');
  }

  /**
   * Function to get the correct color of the match type
   */
  public getColor(likelihood: string): string {
    if (likelihood === 'No Match') {
      return 'black';
    } else if (likelihood === 'Possible Match') {
      return '#E6BE03';
    } else {
      return 'green';
    }
  }

  //ngOnInit() {}
}
