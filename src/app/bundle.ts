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
  let patientBundle = `{
                          "resourceType": "Bundle",
                          "type": "collection",
                          "entry": [
                            {
                              "resource": ` + paramResource;
  //for (const resource in entries)
  entries.forEach(resource => { // for each instead
    patientBundle += `
    ` +JSON.stringify({ "fullUrl" : resource.fullUrl, "resource" : resource.resource}) + `,`;
  });
  patientBundle = patientBundle.slice(0,-1);
  patientBundle += `
                      ]
                     }`;
  return patientBundle;
}
