import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { SearchService } from '../services/search.service';
import { StubSearchService } from '../services/stub-search.service';
import { DistanceService } from './../services/distance.service';
import { ResearchStudySearchEntry } from './../services/search.service';

import { ResultDetailsComponent } from './result-details.component';

import sampleTrial from './sample_trial.json';
import { ActivatedRoute } from '@angular/router';

describe('ResultDetailsComponent', () => {
  let component: ResultDetailsComponent;
  let fixture: ComponentFixture<ResultDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => '0' // The ID used for the result
              }
            }
          }
        },
        {
          // Use the stub search service so HttpClient isn't needed
          provide: SearchService,
          useClass: StubSearchService
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

  it('should create the detail results', () => {
    const distServ = TestBed.inject(DistanceService) as DistanceService;
    component.clinicalTrial = new ResearchStudySearchEntry(sampleTrial, 0, distServ, '01886');
    component.query = {
      zipCode: '01886',
      travelRadius: null,
      phase: null,
      recruitmentStatus: null
    };
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });
  //on testing startup no trial should be saved
  it('trialSaved should be false', () => {
    expect(component.trialSaved).toBeFalsy();
  });
  it('should toggle trial saved', () => {
    const distServ = TestBed.inject(DistanceService) as DistanceService;
    component.clinicalTrial = new ResearchStudySearchEntry(sampleTrial, 0, distServ, '01886');
    component.query = {
      zipCode: '01886',
      travelRadius: null,
      phase: null,
      recruitmentStatus: null
    };
    fixture.detectChanges();
    component.toggleTrialSaved();
    expect(component.trialSaved).toBeTruthy();
  });
  it('should get Color', () => {
    const distServ = TestBed.inject(DistanceService) as DistanceService;
    component.clinicalTrial = new ResearchStudySearchEntry(sampleTrial, 0, distServ, '01886');
    component.query = {
      zipCode: '01886',
      travelRadius: null,
      phase: null,
      recruitmentStatus: null
    };
    fixture.detectChanges();

    expect(component.getColor('No Match')).toBe('black');
    expect(component.getColor('Possible Match')).toBe('#E6BE03');
    expect(component.getColor('likely Match')).toBe('green');
  });
});
