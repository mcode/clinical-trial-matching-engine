import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { RecordDataComponent } from './record-data.component';

describe('RecordDataComponent', () => {
  let component: RecordDataComponent;
  let fixture: ComponentFixture<RecordDataComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [RecordDataComponent]
      }).compileComponents();
    })
  );

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
