import { fhirclient } from 'fhirclient/lib/types';

/**
 * Values that can be placed into parameters
 */
type Stringable = string | number | boolean | null;

/**
 * Create collection bundle from parameters and entries
 */
export function createPatientBundle(
  parameters: { [key: string]: Stringable },
  entries: fhirclient.FHIR.BundleEntry[]
): string {
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
  return JSON.stringify(patientBundle);
}

export interface ParameterResource {
  resourceType?: string;
  id?: string;
  parameter?: { name: string; valueString: Stringable }[];
}

export interface PatientBundle {
  resourceType?: string;
  type?: string;
  entry?: { resource: ParameterResource }[] | { fullUrl: string; resource: fhirclient.FHIR.Resource }[];
}
