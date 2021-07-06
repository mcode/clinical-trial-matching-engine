import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { RecordDataComponent } from './record-data.component';
import Patient from '../patient';

describe('RecordDataComponent', () => {
  let component: RecordDataComponent;
  let fixture: ComponentFixture<RecordDataComponent>;
  let patient: Patient;

  beforeEach(async () => {
    patient = new Patient({
      resourceType: 'Patient' as 'Patient'
    });
    await TestBed.configureTestingModule({
      imports: [MatDialogModule],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            patient: patient,
            resources: []
          }
        }
      ],
      declarations: [RecordDataComponent]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RecordDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create component and set resources', () => {
    component.bundleResources = [
      {
        fullUrl: 'example',
        resource: {
          resourceType: 'Observation'
        }
      },
      {
        fullUrl: 'example2',
        resource: {
          resourceType: 'Condition'
        }
      },
      {
        fullUrl: 'example3',
        resource: {
          resourceType: 'MedicationStatement'
        }
      },
      {
        fullUrl: 'example4',
        resource: {
          resourceType: 'Procedure'
        }
      },
      {
        fullUrl: 'example5',
        resource: {
          resourceType: 'Random'
        }
      }
    ];
    expect(component).toBeTruthy();
  });
});
