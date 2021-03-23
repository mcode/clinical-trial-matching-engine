import { fhirclient } from 'fhirclient/lib/types';
import { Bundle, BundleEntry, Resource } from './fhir-types';

/**
 * Values that can be placed into parameters
 */
type Stringable = string | number | boolean | null;

/**
 * Create collection bundle from parameters and entries
 */
export function createPatientBundle(parameters: { [key: string]: Stringable }, entries: BundleEntry[]): PatientBundle {
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

export interface ParameterResource extends Resource {
  resourceType: 'Parameters';
  parameter?: { name: string; valueString: Stringable }[];
}

export type PatientBundle = Bundle;
