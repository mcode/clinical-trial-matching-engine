import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadPatientComponent } from './upload-patient.component';

describe('UploadPatientComponent', () => {
  let component: UploadPatientComponent;
  let fixture: ComponentFixture<UploadPatientComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UploadPatientComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UploadPatientComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
