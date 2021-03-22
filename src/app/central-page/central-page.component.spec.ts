import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CentralPageComponent } from './central-page.component';

describe('CentralPageComponent', () => {
  let component: CentralPageComponent;
  let fixture: ComponentFixture<CentralPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CentralPageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CentralPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
