import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ResultsPageComponent } from './results-page/results-page.component';
import { SearchPageComponent } from './search-page/search-page.component';

const routes: Routes = [
  { path: 'search', component: SearchPageComponent },
  { path: 'results', component: ResultsPageComponent },
  { path: '', redirectTo: '/search', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
