import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { UploadPatientComponent } from './upload-patient/upload-patient.component';

const routes: Routes = [
  { path: 'upload-patient', component: UploadPatientComponent },
  { path: 'search', component: AppComponent },
  { path: '', redirectTo: '/upload-patient', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
