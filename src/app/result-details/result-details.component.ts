import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';

/**
 * Shows the details page for the results.
 */
@Component({
  selector: 'app-result-details',
  templateUrl: './result-details.component.html',
  styleUrls: ['../app.component.css'] //refer to app component styling for the time being
})
export class ResultDetailsComponent {
  @Input() clinicalTrial: object;
  @Input() trialSaved = false;
  @Output() trialSaveChanged = new EventEmitter<boolean>();

  //constructor() { }

  //ngOnInit() {}

  public toggleTrialSaved(): void {
    this.trialSaved = !this.trialSaved
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
}
