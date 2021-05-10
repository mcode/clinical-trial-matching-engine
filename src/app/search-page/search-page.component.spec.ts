import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';

import { MatDialogModule } from '@angular/material/dialog';

import { ClientService } from '../smartonfhir/client.service';
import { StubClientService } from '../smartonfhir/stub-client.service';
import { SearchService } from '../services/search.service';
import { StubSearchService } from '../services/stub-search.service';

import { AppMaterialModule } from '../shared/material.module';
import { CustomSpinnerComponent } from '../custom-spinner/custom-spinner.component';
import { SearchFieldsComponent } from '../search-fields/search-fields.component';
import { SearchPageComponent } from './search-page.component';

describe('SearchPageComponent', () => {
  let component: SearchPageComponent;
  let fixture: ComponentFixture<SearchPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, RouterTestingModule, MatDialogModule, ToastrModule.forRoot(), AppMaterialModule],
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
      declarations: [CustomSpinnerComponent, SearchFieldsComponent, SearchPageComponent]
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
