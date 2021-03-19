import { BrowserModule } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FormsModule } from '@angular/forms';
// animation module
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CustomSpinnerComponent } from './custom-spinner/custom-spinner.component';
import { FilterDataComponent } from './filter-data/filter-data.component';
import { RecordDataComponent } from './record-data/record-data.component';
import { ResultDetailsComponent } from './result-details/result-details.component';
import { TrialCardComponent } from './trial-card/trial-card.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ToastrModule } from 'ngx-toastr';

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
    CustomSpinnerComponent,
    FilterDataComponent,
    RecordDataComponent,
    ResultDetailsComponent,
    TrialCardComponent
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
  bootstrap: [AppComponent]
})
export class AppModule {}
