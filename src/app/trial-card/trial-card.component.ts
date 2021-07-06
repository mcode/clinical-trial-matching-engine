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

  /**
   * Determines the class to use for the trial status indicator.
   */
  public getStatusClassName(status: string): string {
    if (!(status in ResearchStudyStatusDisplay)) {
      return 'unknown-status';
    } else if (['active'].includes(status)) {
      return 'recruiting';
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
      return 'finished-recruiting';
    } else if (
      [
        'approved',
        'in-review',
        'temporarily-closed-to-accrual',
        'temporarily-closed-to-accrual-and-intervention'
      ].includes(status)
    ) {
      return 'may-recruit';
    }
  }

  /**
   * Maps to the the display text for the trial status indicator.
   */
  public getOverallStatus(status: string): string {
    return status in ResearchStudyStatusDisplay ? ResearchStudyStatusDisplay[status] : 'Invalid';
  }
}
