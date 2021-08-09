import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';
import { CodeableConcept } from '../fhir-types';
import { SnomedCodeDB } from './snomed';

// For now, import the data into the JS - it's fairly small
// A future version should probably load it at runtime
import SNOMED_CODES from '../../assets/snomed.json';
import CANCER_CODES from '../../assets/cancer-codes.json';

/**
 * Interface for a known cancer condition. Note that both primary AND histology
 * can be missing at present - there are a few entries that only have an
 * associated name.
 */
export interface CancerCondition {
  display: string;
  primary?: CodeableConcept;
  histology?: CodeableConcept;
}

/**
 * Provides a service that handles translating user-provided strings to codeable
 * concepts. By default the service is set up to run "in the background" and
 * returns Promises which will resolve when the service is up and running.
 */
@Injectable({
  providedIn: 'root'
})
export class CustomSearchService {
  private codes: CancerCondition[];
  constructor() {
    // Initialize code DB
    this.codes = [];
    const snomedDB = new SnomedCodeDB(SNOMED_CODES);
    for (const cancer of CANCER_CODES) {
      const cancerCondition: CancerCondition = {
        display: cancer.display
      };
      if (cancer.primary) {
        const c = snomedDB.getCodeableConcept(cancer.primary);
        if (c) {
          cancerCondition.primary = c;
        }
      }
      if (cancer.histology) {
        const c = snomedDB.getCodeableConcept(cancer.histology);
        if (c) {
          cancerCondition.histology = c;
        }
      }
      this.codes.push(cancerCondition);
    }
  }

  /**
   * Stub for loading the code data from the server. Currently this returns a
   * resolved Promise as it does nothing.
   * @returns a Promise that resolves when the codes are ready
   */
  loadCodes(): Promise<void> {
    return Promise.resolve();
  }

  /**
   * Look up all codes that match a substring of the given codes.
   * This is implemented as returning an Observable so future versions may work
   * in an async way but at present it simply returns all results via next()
   * synchronously once subscribed to.
   * @param s the string to match against
   * @returns an Observable that generates matching codes
   */
  findCancerConditions(s: string): Observable<CancerCondition> {
    return new Observable((subscriber) => {
      // Currently this basically goes through everything all at once
      s = s.toLowerCase();
      for (const cancer of this.codes) {
        // TODO: Should probably cache the lower case display
        if (cancer.display.toLowerCase().indexOf(s) >= 0) {
          subscriber.next(cancer);
        }
      }
      subscriber.complete();
    });
  }
}
