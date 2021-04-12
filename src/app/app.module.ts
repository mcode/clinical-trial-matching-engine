import { NgModule, Provider, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';
// Module that contains all the Material modules
import { AppMaterialModule } from './shared/material.module';
import { AppRoutingModule } from './app-routing.module';

// FHIR stuff
import { ClientService } from './smartonfhir/client.service';
import { StubClientService } from './smartonfhir/stub-client.service';
import Client from 'fhirclient/lib/Client';

// Search service
import { SearchService } from './services/search.service';
import { StubSearchService } from './services/stub-search.service';

// Custom components
import { AppComponent } from './app.component';
import { CustomSpinnerComponent } from './custom-spinner/custom-spinner.component';
import { RecordDataComponent } from './record-data/record-data.component';
import { ResultDetailsComponent } from './result-details/result-details.component';
import { ResultsComponent } from './results/results.component';
import { SearchFieldsComponent } from './search-fields/search-fields.component';
import { SearchPageComponent } from './search-page/search-page.component';
import { TrialCardComponent } from './trial-card/trial-card.component';

import { environment } from './../environments/environment';
import { ResultsPageComponent } from './results-page/results-page.component';

const fhirInitializeFn = (fhirService: ClientService) => {
  // Grab the client during bootstrap - this prevents the flash of a partially
  // loaded client if SMART on FHIR needs to do an OAuth authentication prior to
  // continuing to bootstrap the Angular app
  return (): Promise<Client> => fhirService.getClient();
};

// Configure how the FHIR provider works depending on local settings
const FHIR_PROVIDER: Provider = {
  provide: ClientService,
  useClass: environment.stubFHIR ? StubClientService : ClientService
};
const SEARCH_PROVIDER: Provider = {
  provide: SearchService,
  useClass: environment.stubSearch ? StubSearchService : SearchService
};
@NgModule({
  // prettier-ignore
  declarations: [
    AppComponent,
    RecordDataComponent,
    ResultDetailsComponent,
    TrialCardComponent,
    CustomSpinnerComponent,
    SearchFieldsComponent,
    ResultsComponent,
    SearchPageComponent,
    ResultsPageComponent
  ],
  // prettier-ignore
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    AppMaterialModule,
    ToastrModule.forRoot()
  ],
  providers: [
    FHIR_PROVIDER,
    SEARCH_PROVIDER,
    {
      provide: APP_INITIALIZER,
      useFactory: fhirInitializeFn,
      multi: true,
      deps: [ClientService]
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
