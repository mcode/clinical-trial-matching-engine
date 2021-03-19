import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ResearchStudySearchEntry } from './../services/search.service';
import { DistanceService } from './../services/distance.service';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TrialCardComponent } from './trial-card.component';

import { Component } from '@angular/core';
import { ViewChild } from '@angular/core';
//declare function require(moduleName: string): any;
import data from '../result-details/sample_trial.json';

describe('TrialCardComponent', () => {
  @Component({
    selector: `host-component`,
    template: `<app-trial-card></app-trial-card>`
  })
  class TestHostComponent {
    @ViewChild(TrialCardComponent, { static: true })
    public trial: TrialCardComponent;
  }

  let testHostComponent: TestHostComponent;
  let testHostFixture: ComponentFixture<TestHostComponent>;

  const sampleTrial = data;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [TrialCardComponent, TestHostComponent],
        imports: [HttpClientTestingModule],
        providers: [DistanceService]
      }).compileComponents();
    })
  );

  beforeEach(() => {
    testHostFixture = TestBed.createComponent(TestHostComponent);
    testHostComponent = testHostFixture.componentInstance;
  });

  it('should create', () => {
    const distServ = TestBed.inject(DistanceService) as DistanceService;
    testHostComponent.trial.clinicalTrial = new ResearchStudySearchEntry(sampleTrial, distServ, '01886');
    testHostComponent.trial.trialSaved = false;
    testHostComponent.trial.reqs = {
      zipCode: '01886',
      travelRadius: null,
      phase: null,
      recruitmentStatus: null
    };
    testHostFixture.detectChanges();
    expect(testHostComponent.trial).toBeTruthy();
  });
  //trialsaved should be false on startup
  it('trial saved should be false', () => {
    const distServ = TestBed.inject(DistanceService) as DistanceService;
    testHostComponent.trial.clinicalTrial = new ResearchStudySearchEntry(sampleTrial, distServ, '01886');
    testHostComponent.trial.trialSaved = false;
    testHostComponent.trial.reqs = {
      zipCode: '01886',
      travelRadius: null,
      phase: null,
      recruitmentStatus: null
    };
    testHostFixture.detectChanges();

    expect(testHostComponent.trial.trialSaved).toBeFalsy();
    testHostComponent.trial.toggleTrialSaved();
    expect(testHostComponent.trial.trialSaved).toBeTruthy();
  });
  it('gets Color according to likelihood', () => {
    const distServ = TestBed.inject(DistanceService) as DistanceService;
    testHostComponent.trial.clinicalTrial = new ResearchStudySearchEntry(sampleTrial, distServ, '01886');
    testHostComponent.trial.trialSaved = false;
    testHostComponent.trial.reqs = {
      zipCode: '01886',
      travelRadius: null,
      phase: null,
      recruitmentStatus: null
    };
    testHostFixture.detectChanges();
    expect(testHostComponent.trial.getColor('No Match')).toBe('black');
    expect(testHostComponent.trial.getColor('Possible Match')).toBe('#E6BE03');
    expect(testHostComponent.trial.getColor('likely Match')).toBe('green');
  });
});
