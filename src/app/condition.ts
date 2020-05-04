/**
 * This provides some utility functions for dealing with conditions
 */

import { fhirclient } from 'fhirclient/lib/types';

export function pullCodesFromConditions(resources: fhirclient.FHIR.Resource[], codingSystem: string = null): string[] {
  let results: string[] = [];
  for (const resource of resources) {
    if (resource.resourceType === 'Condition') {
      // Should have a code
      for (const code of resource.code.coding) {
        if (codingSystem == null || code.system === codingSystem) {
          results.push(code.code);
        }
      }
    }
  }
  return results;
}
