import { Bundle, BundleEntry, Resource } from './fhir-types';
import { TrialQuery } from './services/search-results.service';

/**
 * Values that can be placed into parameters
 */
type Stringable = string | number | boolean | null;

export interface ParameterResource extends Resource {
  resourceType: 'Parameters';
  parameter?: { name: string; valueString: Stringable }[];
}

export type PatientBundle = Bundle;

/**
 * Looks through the bundle to find a ZIP code if one was given as a parameter
 * @param bundle the bundle to look through
 * @returns the ZIP code if one exists
 */
export function getZipCode(bundle: PatientBundle): string | undefined {
  if (bundle.entry) {
    for (const entry of bundle.entry) {
      if (entry.resource?.resourceType === 'Parameters') {
        const parameters = (entry.resource as ParameterResource).parameter;
        if (parameters) {
          for (const param of parameters) {
            if (param.name === 'zipCode') {
              return param.valueString.toString();
            }
          }
        }
      }
    }
  }
  return undefined;
}

/**
 * Create collection bundle from parameters and entries
 */
export function createPatientBundle(parameters: TrialQuery, entries: BundleEntry[]): PatientBundle {
  const paramResource: ParameterResource = { resourceType: 'Parameters', id: '0', parameter: [] };
  for (const p in parameters) {
    // Ignore null values, they indicate a parameter that should be ignored.
    const value = parameters[p];
    if (value === null) continue;
    paramResource.parameter.push({ name: p, valueString: value });
  }
  const patientBundle: PatientBundle = {
    resourceType: 'Bundle',
    type: 'collection',
    entry: [{ resource: paramResource }]
  };
  entries.forEach((resource) => {
    patientBundle.entry.push({ fullUrl: resource.fullUrl, resource: resource.resource });
  });
  return patientBundle;
}
