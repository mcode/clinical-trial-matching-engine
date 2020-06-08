import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TrialCardComponent } from './trial-card.component';

describe('TrialCardComponent', () => {
  let component: TrialCardComponent;
  let fixture: ComponentFixture<TrialCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TrialCardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TrialCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
