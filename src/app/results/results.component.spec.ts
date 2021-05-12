import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { SearchService } from '../services/search.service';
import { StubSearchService } from '../services/stub-search.service';
import { SearchResultsService } from '../services/search-results.service';
import { StubSearchResultsService } from '../services/stub-search-results.service';

import { ResultsComponent } from './results.component';

describe('ResultsComponent', () => {
  let component: ResultsComponent;
  let fixture: ComponentFixture<ResultsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
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
      declarations: [ResultsComponent]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ResultsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should get count', () => {
    // Stub results has 3 results
    expect(component.resultCount).toEqual(3);
  });

  it('should get page count', () => {
    // Stub search result has 1 page
    expect(component.pageCount).toBe(1);
  });

  it('should clear filters', () => {
    // const bundleData = {
    //   resourceType: 'Bundle' as 'Bundle',
    //   type: 'document' as 'document',
    //   link: [],
    //   entry: [testEntry]
    // };
    // const bundle = new SearchResultsBundle(bundleData, distServ, '01886');
    // app.searchResults = bundle;
    // component.createFilters();
    component.clearFilter(0);

    expect(component.filters[0]).toBeDefined();
  });

  it('should show a page', () => {
    // TODO: Make a page visible, check page data
  });

  it('should create filters', () => {
    expect(component.filters).toBeDefined();
  });

  it('should apply filters', () => {
    component.sortType = 'likelihood';
    component.applyFilter();
    expect(component.filters).toBeDefined();
  });
  it('should update items per page', () => {
    // TODO: Implement this
  });
});
