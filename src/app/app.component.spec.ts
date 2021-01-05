import { DistanceService } from './services/distance.service';
import { ResultDetailsComponent } from './result-details/result-details.component';
import { RecordDataComponent } from './record-data/record-data.component';
import { TestBed, async } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
import { NgxSpinnerModule } from 'ngx-spinner';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ClientService } from './smartonfhir/client.service';
import { TrialCardComponent } from './trial-card/trial-card.component';
import { ToastrModule } from 'ngx-toastr';
import { ResearchStudySearchEntry, SearchResultsBundle } from './services/search.service';
import { sample } from 'rxjs/operators';

//Commenting out test cases since Travis doesn't like fhirService
describe('AppComponent', () => {
  let distServ: DistanceService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        NgxSpinnerModule,
        FormsModule,
        RouterTestingModule,
        HttpClientTestingModule,
        BrowserAnimationsModule,
        ToastrModule.forRoot()
      ],
      declarations: [AppComponent, RecordDataComponent, ResultDetailsComponent, TrialCardComponent],
      providers: [ClientService, DistanceService]
    }).compileComponents();
    distServ = TestBed.get(DistanceService);
  }));
  const testEntry = {
    fullUrl: 'http://localhost/',
    resource: {
      resourceType: 'ResearchStudy',
      id: '1',
      contact: [
        {
          name: 'Example Contact',
          telecom: [
            {
              system: 'phone',
              value: '781-555-0100',
              use: 'work'
            },
            {
              system: 'email',
              value: 'email@example.com',
              use: 'work'
            }
          ]
        }
      ],
      contained: [
        {
          resourceType: 'Organization',
          id: 'org1',
          name: 'First Organization'
        },
        {
          resourceType: 'Location',
          id: 'location-1',
          name: 'First Location'
        },
        {
          resourceType: 'Location',
          id: 'location-2',
          name: 'Second Location',
          telecom: [
            {
              system: 'email',
              value: 'email@example.com',
              use: 'work'
            }
          ]
        }
      ],
      site: [
        {
          reference: '#location-1',
          type: 'Location'
        },
        {
          reference: '#location-2',
          type: 'Location'
        }
      ]
    }
  };
  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title in a h1 tag', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('h1').textContent).toContain('CLINICAL TRIAL');
  });

  it("should have as title 'clinicalTrial'", () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app.title).toEqual('clinicalTrial');
  });
  it('should get count', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app.resultCount).toEqual(0);
  });
  it('should get page count', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    app.pages = [];
    expect(app.pageCount).toBe(0);
  });
  it('should set markers for search page', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    app.backToSearch();
    expect(app.searchTable).toBeFalsy();
  });
  it('should set markers for details page', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    const result = new ResearchStudySearchEntry(testEntry, distServ, '01886');

    app.selectedPageTrials = [result];
    app.showDetails(0);
    app.showDetails(0);
    expect(app.searchtable).toBeTruthy();
    expect(app.searchPage).toBeTruthy();

    expect(app.detailsPage).toBeFalsy();
  });
  it('should create pages', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    app.createPages(12);
    expect(app.pages).toBeDefined();
  });
  it('should set flags for viewing a page', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    app.createPages(12);
    const samplepage = app.pages[0];
    const bundleData = {
      type: 'document' as 'document',
      link: [],
      entry: [testEntry]
    };
    const bundle = new SearchResultsBundle(bundleData, distServ, '01886');
    app.searchResults = bundle;
    app.viewPage(samplepage);
    expect(app.searchPage).toBeTruthy();

    expect(app.searchtable).toBeFalsy();
  });
  it('should create filters', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    const bundleData = {
      type: 'document' as 'document',
      link: [],
      entry: [testEntry]
    };
    const bundle = new SearchResultsBundle(bundleData, distServ, '01886');
    app.searchResults = bundle;
    app.createFilters();
    expect(app.filtersArray).toBeDefined();
  });
  it('should apply filters', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    const bundleData = {
      type: 'document' as 'document',
      link: [],
      entry: [testEntry]
    };
    const bundle = new SearchResultsBundle(bundleData, distServ, '01886');
    app.searchResults = bundle;
    app.createFilters();
    app.sortType = 'likelihood';
    app.applyFilter();
    expect(app.filtersArray).toBeDefined();
  });
  it('should update items per page', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    app.updateItemsPerPage('40');
    expect(app.itemsPerPage).toBe(40);
  });
  it('should clear filters', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    const bundleData = {
      type: 'document' as 'document',
      link: [],
      entry: [testEntry]
    };
    const bundle = new SearchResultsBundle(bundleData, distServ, '01886');
    app.searchResults = bundle;
    app.createFilters();
    app.clearFilter(0);

    expect(app.filtersArray[0]).toBeDefined();
  });
  it('should go back to home page', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    app.backToHomePage();
    expect(app.searchtable).toBeTruthy();
    expect(app.searchPage).toBeFalsy();
  });
  it('should show a page', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    app.createPages(12);
    const samplepage = app.pages[0];
    const bundleData = {
      type: 'document' as 'document',
      link: [],
      entry: [testEntry]
    };
    const bundle = new SearchResultsBundle(bundleData, distServ, '01886');
    app.searchResults = bundle;
    app.showPage(0);
    expect(app.searchPage).toBeTruthy();

    expect(app.searchtable).toBeFalsy();
  });
  it('should log error if no searchResults and showing page', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    app.createPages(12);
    const samplepage = app.pages[0];
    app.showPage(0);
  });
});
