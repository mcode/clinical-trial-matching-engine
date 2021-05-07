import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ToastrModule } from 'ngx-toastr';

import { MatDialogModule } from '@angular/material/dialog';

import { ClientService } from '../smartonfhir/client.service';
import { StubClientService } from '../smartonfhir/stub-client.service';
import { SearchService } from '../services/search.service';
import { StubSearchService } from '../services/stub-search.service';

import { SearchPageComponent } from './search-page.component';

describe('SearchPageComponent', () => {
  let component: SearchPageComponent;
  let fixture: ComponentFixture<SearchPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, MatDialogModule, ToastrModule.forRoot()],
      providers: [
        // Stub out client/search service with test data
        {
          provide: ClientService,
          useClass: StubClientService
        },
        {
          provide: SearchService,
          useClass: StubSearchService
        }
      ],
      declarations: [SearchPageComponent]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SearchPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
