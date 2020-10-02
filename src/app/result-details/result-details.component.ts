import { ResearchStudySearchEntry } from './../services/search.service';
import { Component, Input, Output, EventEmitter } from '@angular/core';

/**
 * Shows the details page for the results.
 */
@Component({
  selector: 'app-result-details',
  templateUrl: './result-details.component.html',
  styleUrls: ['../app.component.css'] //refer to app component styling for the time being
})
export class ResultDetailsComponent {
  @Input() reqs: object;
  @Input() clinicalTrial: ResearchStudySearchEntry;
  @Input() trialSaved = false;
  @Output() trialSaveChanged = new EventEmitter<boolean>();

  //constructor() { }

  //ngOnInit() {}

  public toggleTrialSaved(): void {
    this.trialSaved = !this.trialSaved;
    this.trialSaveChanged.emit(this.trialSaved);
  }

  public replace(value: string): string {
    return value.replace(/[\[\]_'""]+/g, ' ');
  }

  /**
   * Toggle visibility of accordion sections (specifically, looks for next
   * sibling that is a panel and then toggles the visibility of the display
   * on its style element).
   */
  public showHideAccordian(event): void {
    for (let sibling = event.target.nextElementSibling; sibling; sibling = sibling.nextElementSibling) {
      if (/\bpanel\b/.test(sibling.className)) {
        if (sibling.style.display === 'block') {
          sibling.style.display = 'none';
        } else {
          sibling.style.display = 'block';
        }
        break;
      }
    }
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
}
