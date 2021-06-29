import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ResearchStudySearchEntry } from './../services/ResearchStudySearchEntry';
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
    if (id) {
      this.clinicalTrial = this.resultsService.getResult(id);
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
   * Used to create basic summary text from longer text.
   * @param text the text to create a summary of
   * @returns summary text
   */
  summary(text: string): string {
    // substring clamps the range to the string, so the following returns up to 255 characters but not the entire thing
    return text.replace(/[\s\r\n]+/g, ' ').substring(0, 255);
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
