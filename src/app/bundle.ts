import { fhirclient } from 'fhirclient/lib/types';
import patient from '../assets/patient1.json';

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
): PatientBundle {
  const paramResource: ParameterResource = { resourceType: 'Parameters', id: '0', parameter: [] };
  for (const p in parameters) {
    // Ignore null values, they indicate a parameter that should be ignored.
    const value = parameters[p];
    if (value === null) continue;
    paramResource.parameter.push({ name: p, valueString: value });
  }
  // need to remove final comma
  paramResource = paramResource.slice(0, -1);
  paramResource += `
                     ]
                    }
                  },`;
  let patientBundle =
    `{
                          "resourceType": "Bundle",
                          "type": "collection",
                          "entry": [
                            {
                              "resource": ` + paramResource;
  // for (const resource in entries)
  // entries.forEach((resource) => {
  //   // for each instead
  //   patientBundle += `
  //   ${JSON.stringify({ fullUrl: resource.fullUrl, resource: resource.resource })},`;
  // });

  patient.entry.forEach((resource) => {
    patientBundle += `${JSON.stringify(resource)},`;
  })

  patientBundle = patientBundle.slice(0, -1);
  patientBundle += `
                      ]
                     }`;
  
  console.log(patientBundle);
  return patientBundle;
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
