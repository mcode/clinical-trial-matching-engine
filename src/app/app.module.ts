import { BrowserModule } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FormsModule } from '@angular/forms';
// animation module
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ClientService } from './smartonfhir/client.service';
import { RecordDataComponent } from './record-data/record-data.component';
import { ResultDetailsComponent } from './result-details/result-details.component';
import { TrialCardComponent } from './trial-card/trial-card.component';
import { CustomSpinnerComponent } from './custom-spinner/custom-spinner.component';
import Client from 'fhirclient/lib/Client';
import { MatFormFieldModule, MatSelectModule } from '@angular/material';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ToastrModule } from 'ngx-toastr';

const fhirInitializeFn = (fhirService: ClientService) => {
  // Grab the client during bootstrap - this prevents the flash of a partially
  // loaded client if SMART on FHIR needs to do an OAuth authentication prior to
  // continuing to bootstrap the Angular app
  return (): Promise<Client> => fhirService.getClient();
};

/**
 * NgModule with required Material modules
 */
@NgModule({
  exports: [MatFormFieldModule, MatSelectModule, MatProgressSpinnerModule]
})
export class MaterialModule {}
@NgModule({
  // prettier-ignore
  declarations: [
    AppComponent,
    RecordDataComponent,
    ResultDetailsComponent,
    TrialCardComponent,
    CustomSpinnerComponent
  ],
  // prettier-ignore
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    BrowserAnimationsModule,
    MaterialModule,
    ToastrModule.forRoot()
  ],
  providers: [
    ClientService,
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
