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
//Commenting out test cases since Travis doesn't like fhirService
describe('AppComponent', () => {
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
      providers: [ClientService]
    }).compileComponents();
  }));

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
});
