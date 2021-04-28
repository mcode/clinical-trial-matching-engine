import { DistanceService } from './../services/distance.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ResearchStudySearchEntry } from './../services/search.service';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

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

  const sampleTrial = data;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [ResultDetailsComponent, TestHostComponent],
        imports: [HttpClientTestingModule],
        providers: [DistanceService]
      }).compileComponents();
    })
  );

  beforeEach(() => {
    testHostFixture = TestBed.createComponent(TestHostComponent);
    testHostComponent = testHostFixture.componentInstance;
  });

  it('should create the detail results', () => {
    const distServ = TestBed.inject(DistanceService) as DistanceService;
    testHostComponent.resultDetails.clinicalTrial = new ResearchStudySearchEntry(sampleTrial, distServ, '01886',"example source");
    testHostComponent.resultDetails.reqs = {
      zipCode: '01886',
      travelRadius: null,
      phase: null,
      recruitmentStatus: null
    };
    testHostFixture.detectChanges();

    expect(testHostComponent.resultDetails).toBeTruthy();
  });
  //on testing startup no trial should be saved
  it('trialSaved should be false', () => {
    expect(testHostComponent.resultDetails.trialSaved).toBeFalsy();
  });
  it('should toggle trial saved', () => {
    const distServ = TestBed.inject(DistanceService) as DistanceService;
    testHostComponent.resultDetails.clinicalTrial = new ResearchStudySearchEntry(sampleTrial, distServ, '01886',"example source");
    testHostComponent.resultDetails.reqs = {
      zipCode: '01886',
      travelRadius: null,
      phase: null,
      recruitmentStatus: null
    };
    testHostFixture.detectChanges();
    testHostComponent.resultDetails.toggleTrialSaved();
    expect(testHostComponent.resultDetails.trialSaved).toBeTruthy();
  });
  it('should get Color', () => {
    const distServ = TestBed.inject(DistanceService) as DistanceService;
    testHostComponent.resultDetails.clinicalTrial = new ResearchStudySearchEntry(sampleTrial, distServ, '01886',"example source");
    testHostComponent.resultDetails.reqs = {
      zipCode: '01886',
      travelRadius: null,
      phase: null,
      recruitmentStatus: null
    };
    testHostFixture.detectChanges();

    expect(testHostComponent.resultDetails.getColor('No Match')).toBe('black');
    expect(testHostComponent.resultDetails.getColor('Possible Match')).toBe('#E6BE03');
    expect(testHostComponent.resultDetails.getColor('likely Match')).toBe('green');
  });
});
