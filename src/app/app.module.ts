import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule, Routes } from '@angular/router';

import { AppComponent } from './app.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
// animation module
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CustomSpinnerComponent } from './custom-spinner/custom-spinner.component';
import { FilterDataComponent } from './filter-data/filter-data.component';
import { RecordDataComponent } from './record-data/record-data.component';
import { ResultDetailsComponent } from './result-details/result-details.component';
import { TrialCardComponent } from './trial-card/trial-card.component';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ToastrModule } from 'ngx-toastr';
import { CentralPageComponent } from './central-page/central-page.component';
import { UploadPatientComponent } from './upload-patient/upload-patient.component';

const appRoutes: Routes = [
  { path: 'upload-patient', component: UploadPatientComponent },
  { path: 'search', component: AppComponent },
  { path: '', redirectTo: '/upload-patient', pathMatch: 'full' }
];

/**
 * NgModule with required Material modules
 */
@NgModule({
  exports: [MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatProgressSpinnerModule],
  declarations: []
})
export class MaterialModule {}
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
    CentralPageComponent
  ],
  // prettier-ignore
  imports: [
    BrowserModule,
    HttpClientModule,
    RouterModule.forRoot(appRoutes, { enableTracing: true }),
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    MaterialModule,
    ToastrModule.forRoot()
  ],
  bootstrap: [CentralPageComponent]
})
export class AppModule {}
