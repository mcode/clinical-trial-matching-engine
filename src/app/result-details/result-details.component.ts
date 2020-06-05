import { Component, Input, OnInit } from '@angular/core';

/**
 * Shows the details page for the results.
 */
@Component({
  selector: 'app-result-details',
  templateUrl: './result-details.component.html',
  styleUrls: ['./result-details.component.css']
})
export class ResultDetailsComponent implements OnInit {
  @Input() clinicalTrial: object;

  constructor() { }

  ngOnInit() {
  }

  public get trialSaved(): boolean {
    // FIXME: Actually determine if the trial is saved
    return false;
  }

  public toggleTrialSaved(): void {
    // FIXME: Actually toggle the save status of the trial (probably going to
    // be an @Output event)
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
