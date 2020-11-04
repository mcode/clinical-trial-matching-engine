/**
 * This provides some utility functions for dealing with conditions
 */

import { fhirclient } from 'fhirclient/lib/types';

export function pullCodesFromConditions(resources: fhirclient.FHIR.Resource[], codingSystem: string = null): string[] {
  const results: string[] = [];
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

/**
 * A simple wrapper around a FHIR Condition resource to simplify pulling out
 * codes and display text.
 */
export class Condition {
  public resource: fhirclient.FHIR.Resource;

  constructor(resource: fhirclient.FHIR.Resource) {
    this.resource = resource;
  }

  /**
   * Pulls the display text out of the code.
   */
  getDisplayText(): string {
    return this.resource.code.text;
  }
}
