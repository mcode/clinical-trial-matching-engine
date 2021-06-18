// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment: {
  production: boolean;
  stubFHIR?: boolean;
  stubSearch?: boolean;
  stubSearchResults?: boolean;
  servers: { name: string; url: string }[];
} = {
  production: false,
  // When true, stub out the FHIR service for a test one
  stubFHIR: false,
  // When true, stub out the search service for a test one
  stubSearch: false,
  // When true, have the search service act as if the user already searched
  stubSearchResults: false,
  servers: [
    { name: 'Trialscope', url: 'http://localhost:3000' },
    { name: 'Breast Cancer Trials', url: 'http://localhost:3001' }
  ]
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
