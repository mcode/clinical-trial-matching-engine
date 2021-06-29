import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SearchService } from '../services/search.service';
import { StubSearchService } from '../services/stub-search.service';
import { SearchResultsService } from '../services/search-results.service';
import { StubSearchResultsService } from '../services/stub-search-results.service';
import { AppMaterialModule } from '../shared/material.module';

import { ResultDetailsComponent } from './result-details.component';

import { ActivatedRoute } from '@angular/router';

describe('ResultDetailsComponent', () => {
  let component: ResultDetailsComponent;
  let fixture: ComponentFixture<ResultDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, AppMaterialModule, NoopAnimationsModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => 'Test_Service_0' // The ID used for the result
              }
            }
          }
        },
        // Use stub search/search results services to pre-populate results
        {
          provide: SearchService,
          useClass: StubSearchService
        },
        {
          provide: SearchResultsService,
          useClass: StubSearchResultsService
        }
      ],
      declarations: [ResultDetailsComponent]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ResultDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeDefined();
  });

  //on testing startup no trial should be saved
  it('trialSaved should be initially false', () => {
    expect(component.trialSaved).toBeFalse();
  });

  it('should toggle trial saved', () => {
    component.toggleTrialSaved();
    expect(component.trialSaved).toBeTrue();
  });

  it('should get Color', () => {
    expect(component.getColor('No Match')).toBe('black');
    expect(component.getColor('Possible Match')).toBe('#E6BE03');
    expect(component.getColor('likely Match')).toBe('green');
  });

  it('should get trial status color', () => {
    expect(component.getStatusClassName('active')).toBe('recruiting');
    expect(component.getStatusClassName('closed-to-accrual-and-intervention')).toBe('finished-recruiting');
    expect(component.getStatusClassName('in-review')).toBe('may-recruit');
    expect(component.getStatusClassName('test-string')).toBe('unknown-status');
  });

  it('should get trial status display text', () => {
    expect(component.getOverallStatus('test-string')).toBe('Invalid');
    expect(component.getOverallStatus('closed-to-accrual-and-intervention')).toBe('Closed to Accrual and Intervention');
  });
});
