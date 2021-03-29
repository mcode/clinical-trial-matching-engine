import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { AppComponent } from './app.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
// animation module
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CustomSpinnerComponent } from './custom-spinner/custom-spinner.component';
import { FilterDataComponent } from './filter-data/filter-data.component';
import { RecordDataComponent } from './record-data/record-data.component';
import { ResultDetailsComponent } from './result-details/result-details.component';
import { TrialCardComponent } from './trial-card/trial-card.component';
import { ToastrModule } from 'ngx-toastr';
import { CentralPageComponent } from './central-page/central-page.component';
import { UploadPatientComponent } from './upload-patient/upload-patient.component';
import { AppRoutingModule } from './app-routing.module';
import { AppMaterialModule } from './shared/material.module';
import { SearchFieldsComponent } from './search-fields/search-fields.component';

@NgModule({
  // prettier-ignore
  declarations: [
    AppComponent,
    CustomSpinnerComponent,
    FilterDataComponent,
    RecordDataComponent,
    ResultDetailsComponent,
    TrialCardComponent,
    UploadPatientComponent,
    CentralPageComponent,
    SearchFieldsComponent
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
  bootstrap: [CentralPageComponent]
})
export class AppModule {}
