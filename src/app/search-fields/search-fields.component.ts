import { Component, Output, EventEmitter } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import {
  ResearchStudyPhase,
  ResearchStudyPhaseDisplay,
  ResearchStudyStatus,
  ResearchStudyStatusDisplay
} from '../fhir-constants';
import { TrialQuery } from '../services/search-results.service';

interface DropdownOption {
  display: string;
  value: string;
}

// Currently these are identical, but in the future it's possible they may
// diverge.
type Phase = DropdownOption;
type RecruitmentStatus = DropdownOption;

@Component({
  selector: 'app-search-fields',
  templateUrl: './search-fields.component.html',
  styleUrls: ['./search-fields.component.css']
})
export class SearchFieldsComponent {
  phases: Phase[];
  recruitmentStatuses: RecruitmentStatus[];
  @Output() searchClicked = new EventEmitter<TrialQuery>();

  zipCode = new FormControl('', [Validators.required, Validators.pattern('[0-9]{5}')]);
  travelDistance = new FormControl('', [Validators.required, Validators.min(0)]);
  trialPhase = new FormControl('any');
  recruitmentStatus = new FormControl('all');

  constructor() {
    this.phases = Object.values(ResearchStudyPhase).map((value) => {
      return {
        value: value,
        display: ResearchStudyPhaseDisplay[value]
      };
    });
    this.recruitmentStatuses = Object.values(ResearchStudyStatus).map((value) => {
      return {
        value: value,
        display: ResearchStudyStatusDisplay[value]
      };
    });
  }

  /**
   * Handles starting a search. Fires an event on the searchClicked handler. If given an HTML event that triggered
   * this, calls preventDefault().
   * @param event the HTML event that triggered this
   * @returns false
   */
  search(event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    const searchEvent: TrialQuery = {
      zipCode: this.zipCode.value,
      travelRadius: this.travelDistance.value
    };
    if (this.trialPhase.value !== 'any') searchEvent.phase = this.trialPhase.value;
    if (this.recruitmentStatus.value !== 'all') searchEvent.recruitmentStatus = this.recruitmentStatus.value;
    this.searchClicked.emit(searchEvent);
  }
}
