/**
 * Values that can be placed into parameters
 */
type Stringable = string | number | boolean | null;

/**
* Create collection bundle from parameters and entries
*/
export function createPatientBundle(parameters: {[key: string]: Stringable}, entries: any[]): string {
  let paramResource = `{
                         "resourceType": "Parameters",
                         "id": "0",
                         "parameter": [`
  for (const p in parameters) {
    paramResource += `{
                        "name": "`+ p + `",
                        "valueString": "` + parameters[p] + `"
                      },`;
  }
  // need to remove final comma
  paramResource = paramResource.slice(0,-1);
  paramResource += `
                     ]
                    }
                  },`
  let patient_bundle = `{
                          "resourceType": "Bundle",
                          "type": "collection",
                          "entry": [
                            {
                              "resource": ` + paramResource;
  for (const resource in entries) {
    patient_bundle += `
    ` +JSON.stringify({ "fullUrl" : entries[resource].fullUrl, "resource" : entries[resource].resource}) + `,`;
  }
  patient_bundle = patient_bundle.slice(0,-1);
  patient_bundle += `
                      ]
                     }`;
  console.log(patient_bundle);
  return patient_bundle;
}
