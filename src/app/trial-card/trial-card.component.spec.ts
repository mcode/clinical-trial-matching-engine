import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ResearchStudySearchEntry } from './../services/ResearchStudySearchEntry';
import { DistanceService } from './../services/distance.service';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrialCardComponent } from './trial-card.component';

import data from '../result-details/sample_trial.json';

describe('TrialCardComponent', () => {
  let component: TrialCardComponent;
  let fixture: ComponentFixture<TrialCardComponent>;

  const sampleTrial = data;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TrialCardComponent],
      imports: [HttpClientTestingModule],
      providers: [DistanceService]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TrialCardComponent);
    component = fixture.componentInstance;
    const distServ = TestBed.inject(DistanceService) as DistanceService;
    component.clinicalTrial = new ResearchStudySearchEntry(sampleTrial, distServ, '01886', 'example source');
    component.trialSaved = false;
    component.query = {
      zipCode: '01886',
      travelRadius: null,
      phase: null,
      recruitmentStatus: null
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  //trialsaved should be false on startup
  it('trial saved should be false', () => {
    expect(component.trialSaved).toBeFalsy();
    component.toggleTrialSaved();
    expect(component.trialSaved).toBeTruthy();
  });

  it('gets Color according to likelihood', () => {
    component.clinicalTrial.search = { score: 0.1 };
    expect(component.likelihoodColor()).toBe('black');
    component.clinicalTrial.search = { score: 0.5 };
    expect(component.likelihoodColor()).toBe('#E6BE03');
    component.clinicalTrial.search = { score: 0.9 };
    expect(component.likelihoodColor()).toBe('green');
  });

  it('should get trial status color', () => {
    expect(component.trialStatusColor('active')).toBe('#30b400');
    expect(component.trialStatusColor('closed-to-accrual-and-intervention')).toBe('#ba2020');
    expect(component.trialStatusColor('in-review')).toBe('#0b96d6');
    expect(component.trialStatusColor('test-string')).toBe('#ff0084');
  });
});
