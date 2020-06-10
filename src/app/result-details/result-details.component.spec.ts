import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ResultDetailsComponent } from './result-details.component';

import { Component } from "@angular/core";
import { ViewChild } from "@angular/core";
describe('ResultDetailsComponent', () => {
  let testHostComponent: TestHostComponent;
  let testHostFixture: ComponentFixture<TestHostComponent>;

  let sample_trial: any = require('./sample_trial.json');
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
    testHostComponent.result_details.clinicalTrial = sample_trial;
    testHostFixture.detectChanges();

    expect(testHostComponent.result_details).toBeTruthy();
  });

  @Component({
    selector: `host-component`,
    template: `<app-result-details></app-result-details>`
  })
  class TestHostComponent {
    @ViewChild(ResultDetailsComponent, { static: true })
    public result_details: ResultDetailsComponent;
  }
});

