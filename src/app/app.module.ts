import { BrowserModule } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CommonService } from './services/common/common.service';
import { FormsModule } from '@angular/forms';
import { NgxSpinnerModule } from 'ngx-spinner';
// animation module
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ClientService } from './smartonfhir/client.service';
import { ResultDetailsComponent } from './result-details/result-details.component';

const fhirInitializeFn = (fhirService: ClientService) => {
  // Grab the client during bootstrap - this prevents the flash of a partially
  // loaded client if SMART on FHIR needs to do an OAuth authentication prior to
  // continuing to bootstrap the Angular app
  return () => fhirService.getClient();
};

@NgModule({
  declarations: [
    AppComponent,
    ResultDetailsComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    NgxSpinnerModule,
    BrowserAnimationsModule
  ],
  providers: [
    CommonService,
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
export class AppModule { }
