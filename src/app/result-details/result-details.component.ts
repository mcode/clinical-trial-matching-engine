import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ResearchStudySearchEntry } from './../services/search.service';
import { SearchResultsService, TrialQuery } from './../services/search-results.service';

/**
 * Shows the details page for the results.
 */
@Component({
  selector: 'app-result-details',
  templateUrl: './result-details.component.html',
  styleUrls: ['./result-details.component.css']
})
export class ResultDetailsComponent implements OnInit {
  query: TrialQuery;
  clinicalTrial: ResearchStudySearchEntry;
  trialSaved = false;

  constructor(private route: ActivatedRoute, private router: Router, private resultsService: SearchResultsService) {}

  ngOnInit() {
    this.query = this.resultsService.query;
    const id = this.route.snapshot.paramMap.get('id');
    if (id && /^[0-9]+$/.test(id)) {
      // Basic test to ensure it's an integer
      const index = Number(id);
      this.clinicalTrial = this.resultsService.getResult(index);
      this.trialSaved = this.resultsService.isTrialSaved(this.clinicalTrial);
    }
  }

  navigateToResults(): void {
    this.router.navigateByUrl('/results');
  }

  toggleTrialSaved(): void {
    this.trialSaved = this.resultsService.toggleTrialSaved(this.clinicalTrial);
  }

  replace(value: string): string {
    return value.replace(/[\[\]_'""]+/g, ' ');
  }

  /**
   * Toggle visibility of accordion sections (specifically, looks for next
   * sibling that is a panel and then toggles the visibility of the display
   * on its style element).
   */
  showHideAccordian(event): void {
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
  getColor(likelihood: string): string {
    if (likelihood === 'No Match') {
      return 'black';
    } else if (likelihood === 'Possible Match') {
      return '#E6BE03';
    } else {
      return 'green';
    }
  }
}
