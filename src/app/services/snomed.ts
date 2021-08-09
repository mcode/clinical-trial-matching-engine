/**
 * This module provides types and classes related to reading SNOMED codes.
 */

import { CodeableConcept } from '../fhir-types';

export const SNOMED_CODE_URI = 'http://snomed.info/sct';

/**
 * Given a JSON object that contains SNOMED codes to their display names, this
 * provides a method to generate CodeableConcepts from those codes.
 */
export class SnomedCodeDB {
  constructor(private codes: Record<string, string>) {}

  getDisplay(code: string | number): string | undefined {
    if (typeof code !== 'string') {
      code = code.toString();
    }
    return this.codes[code];
  }

  getCodeableConcept(code: string | number): CodeableConcept | undefined {
    if (typeof code !== 'string') {
      code = code.toString();
    }
    const display = this.getDisplay(code);
    if (display) {
      return {
        coding: [
          {
            system: SNOMED_CODE_URI,
            code: code,
            display: display
          }
        ],
        text: display
      };
    } else {
      return undefined;
    }
  }
}
