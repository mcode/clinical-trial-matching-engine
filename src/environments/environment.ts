// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  // When true, stub out the FHIR service for a test one
  stubFHIR: true,
  // When true, stub out the search service for a test one
  stubSearch: true,
  // When true, have the search service act as if the user already searched
  stubSearchResults: true,
  serviceURL: 'http://localhost:3000',
  allServers: { 'http://localhost:3000': 'Trialscope', 'http://localhost:3001': 'Breast Cancer Trials' }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
