import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TrialCardComponent } from './trial-card.component';


import { Component } from "@angular/core";
import { ViewChild } from "@angular/core";

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

  const sampleTrial: any = require('../result-details/sample_trial.json');

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TrialCardComponent, TestHostComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    testHostFixture = TestBed.createComponent(TestHostComponent);
    testHostComponent = testHostFixture.componentInstance;
  });

  it('should create', () => {
    testHostComponent.trial.clinicalTrial = sampleTrial;
    testHostComponent.trial.trialSaved = false;
    testHostFixture.detectChanges();

    expect(testHostComponent.trial).toBeTruthy();
  });

});
