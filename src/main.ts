import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

import FHIR from 'fhirclient';

if (environment.production) {
  enableProdMode();
}

// Let the FHIR client do its thing before starting Angular
FHIR.oauth2
  .init({
    clientId: 'Input client id you get when you register the app',
    scope: 'launch/patient openid profile'
  })
  .then(client => {
    platformBrowserDynamic().bootstrapModule(AppModule)
      .catch(err => console.error(err));
  })
  .catch(error => {
    // TODO: Handle this in a user-visible way
    console.error(error)
  });
