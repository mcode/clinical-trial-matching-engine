import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ResultDetailsComponent } from './result-details.component';

import { Component } from "@angular/core";
import { ViewChild } from "@angular/core";
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

  const sampleTrial: any = data //require('./sample_trial.json');
  //console.log(sample_trial);
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ResultDetailsComponent, TestHostComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    testHostFixture = TestBed.createComponent(TestHostComponent);
    testHostComponent = testHostFixture.componentInstance;
  });

  it('should create the detail results', () => {
    testHostComponent.resultDetails.clinicalTrial = sampleTrial;
    testHostFixture.detectChanges();

    expect(testHostComponent.resultDetails).toBeTruthy();
  });


});

