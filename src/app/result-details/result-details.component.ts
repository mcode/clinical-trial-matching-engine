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

  /**
   * Toggle visibility of accordion sections (specifically, looks for next
   * sibling that is a parent and then toggles the visibility of the display
   * on its style element).
   */
  public showHideAccordian(event) {
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
