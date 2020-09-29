import { async, ComponentFixture, TestBed } from '@angular/core/testing';

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

  const sampleTrial: object = data;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TrialCardComponent, TestHostComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    testHostFixture = TestBed.createComponent(TestHostComponent);
    testHostComponent = testHostFixture.componentInstance;
  });

  xit('should create', () => {
    testHostComponent.trial.clinicalTrial = sampleTrial;
    testHostComponent.trial.trialSaved = false;
    testHostComponent.trial.reqs = {
      zipCode: '01234',
      travelRadius: null,
      phase: null,
      recruitmentStatus: null
    };
    testHostFixture.detectChanges();
    expect(testHostComponent.trial).toBeTruthy();
  });
  //trialsaved should be false on startup
  xit('trial saved should be false', () => {
    testHostComponent.trial.clinicalTrial = sampleTrial;
    testHostComponent.trial.trialSaved = false;
    testHostComponent.trial.reqs = {
      zipCode: '01234',
      travelRadius: null,
      phase: null,
      recruitmentStatus: null
    };
    testHostFixture.detectChanges();

    expect(testHostComponent.trial.trialSaved).toBeFalsy();
  });
});
