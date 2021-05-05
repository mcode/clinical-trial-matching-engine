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
    const distServ = TestBed.inject(DistanceService) as DistanceService;
    testHostFixture = TestBed.createComponent(TestHostComponent);
    testHostComponent = testHostFixture.componentInstance;
    testHostComponent.trial.clinicalTrial = new ResearchStudySearchEntry(sampleTrial, 0, distServ, '01886');
    testHostComponent.trial.trialSaved = false;
    testHostComponent.trial.query = {
      zipCode: '01886',
      travelRadius: null,
      phase: null,
      recruitmentStatus: null
    };
    testHostFixture.detectChanges();
  });

  it('should create', () => {
    expect(testHostComponent.trial).toBeTruthy();
  });

  //trialsaved should be false on startup
  it('trial saved should be false', () => {
    expect(testHostComponent.trial.trialSaved).toBeFalsy();
    testHostComponent.trial.toggleTrialSaved();
    expect(testHostComponent.trial.trialSaved).toBeTruthy();
  });

  it('gets Color according to likelihood', () => {
    testHostComponent.trial.clinicalTrial.search = { score: 0.1 };
    expect(testHostComponent.trial.likelihoodColor()).toBe('black');
    testHostComponent.trial.clinicalTrial.search = { score: 0.5 };
    expect(testHostComponent.trial.likelihoodColor()).toBe('#E6BE03');
    testHostComponent.trial.clinicalTrial.search = { score: 0.9 };
    expect(testHostComponent.trial.likelihoodColor()).toBe('green');
  });
});
