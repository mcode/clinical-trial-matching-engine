import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { ResearchStudySearchEntry } from '../services/ResearchStudySearchEntry';
import { TrialQuery } from '../services/search-results.service';
import { ResearchStudyStatusDisplay } from '../fhir-constants';

@Component({
  selector: 'app-trial-card',
  templateUrl: './trial-card.component.html',
  styleUrls: ['./trial-card.component.css']
})
export class TrialCardComponent implements OnChanges {
  @Input() query: TrialQuery;
  @Input() clinicalTrial: ResearchStudySearchEntry;
  @Input() trialSaved;
  @Output() trialSaveChanged = new EventEmitter<boolean>();
  /**
   * Formatted distance string, or null if not known
   */
  trialSiteDistance: string | null;
  statusDisplay = ResearchStudyStatusDisplay;

  ngOnChanges(changes: SimpleChanges): void {
    if ('query' in changes || 'clinicalTrial' in changes) {
      // If the query or clinical trial has changed, update the distance
      this.trialSiteDistance =
        this.query && this.clinicalTrial ? this.clinicalTrial.getClosest(this.query.zipCode) : null;
    }
  }

  public toggleTrialSaved(): void {
    this.trialSaved = !this.trialSaved;
    this.trialSaveChanged.emit(this.trialSaved);
  }

  public replace(value: string): string {
    return value.replace(/[\[\]_'""]+/g, ' ');
  }

  /**
   * Determines the color to use for the likelihood indicator.
   */
  public likelihoodColor(): string {
    switch (this.clinicalTrial.matchLikelihood) {
      case 'No Match':
        return 'black';
      case 'Possible Match':
        return '#E6BE03';
      default:
        return 'green';
    }
  }

  public trialStatusColor(status: string): string {
    if (['active'].includes(status)) {
      return '#30b400';
    } else if (
      [
        'administratively-completed',
        'closed-to-accrual',
        'closed-to-accrual-and-intervention',
        'completed',
        'disapproved',
        'withdrawn'
      ].includes(status)
    ) {
      return '#ba2020';
    } else if (
      [
        'approved',
        'in-review',
        'temporarily-closed-to-accrual',
        'temporarily-closed-to-accrual-and-intervention'
      ].includes(status)
    ) {
      return '#0b96d6';
    } else {
      return '#ff0084';
    }
  }
}
