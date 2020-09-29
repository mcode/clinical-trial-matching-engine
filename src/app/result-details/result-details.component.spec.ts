import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ResultDetailsComponent } from './result-details.component';

import { Component } from '@angular/core';
import { ViewChild } from '@angular/core';
import data from './sample_trial.json';
describe('ResultDetailsComponent', () => {
  @Component({
    selector: `host-component`,
    template: `<app-result-details></app-result-details>`
  })
  class TestHostComponent {
    @ViewChild(ResultDetailsComponent, { static: true })
    public resultDetails: ResultDetailsComponent;
  }
  let testHostComponent: TestHostComponent;
  let testHostFixture: ComponentFixture<TestHostComponent>;

  const sampleTrial: object = data;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ResultDetailsComponent, TestHostComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    testHostFixture = TestBed.createComponent(TestHostComponent);
    testHostComponent = testHostFixture.componentInstance;
  });

  xit('should create the detail results', () => {
    testHostComponent.resultDetails.clinicalTrial = sampleTrial;
    testHostComponent.resultDetails.reqs = {
      zipCode: '01234',
      travelRadius: null,
      phase: null,
      recruitmentStatus: null
    };
    testHostFixture.detectChanges();

    expect(testHostComponent.resultDetails).toBeTruthy();
  });
  //on testing startup no trial should be saved
  xit('trialSaved should be false', () => {
    expect(testHostComponent.resultDetails.trialSaved).toBeFalsy();
  });
});
