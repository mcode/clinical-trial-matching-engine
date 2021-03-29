import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';

interface DropdownOption {
  display: string;
  value: string;
}

// Currently these are identical, but in the future it's possible they may
// diverge.
type Phase = DropdownOption;
type RecruitmentStatus = DropdownOption;

export interface SearchFields {
  zipCode: string;
  travelDistance: number;
  trialPhase?: string;
  recruitmentStatus?: string;
}

@Component({
  selector: 'app-search-fields',
  templateUrl: './search-fields.component.html',
  styleUrls: ['./search-fields.component.css']
})
export class SearchFieldsComponent {
  @Input() phases: Phase[];
  @Input() recruitmentStatuses: RecruitmentStatus[];
  @Output() searchClicked = new EventEmitter<SearchFields>();

  zipCode = new FormControl('', [Validators.required, Validators.pattern('[0-9]{5}')]);
  travelDistance = new FormControl('', [Validators.required, Validators.min(0)]);
  trialPhase = new FormControl('any');
  recruitmentStatus = new FormControl('all');

  constructor() {}

  search() {
    const event: SearchFields = {
      zipCode: this.zipCode.value,
      travelDistance: this.travelDistance.value
    };
    if (this.trialPhase.value !== 'any') event.trialPhase = this.trialPhase.value;
    if (this.recruitmentStatus.value !== 'all') event.recruitmentStatus = this.recruitmentStatus.value;
    this.searchClicked.emit(event);
  }
}
