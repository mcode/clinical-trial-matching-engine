// This provides a very basic patient object.

import { fhirclient } from 'fhirclient/lib/types';

type FHIRPatient = fhirclient.FHIR.Patient;

/** Maps name types to their "power" - higher is better (makes the comparison read better below) */
const casualNamePreferences = {
  'usual': 3,
  'nickname': 2,
  'official': 1
};

export default class Patient {
  /**
   * The underlying FHIR resource.
   */
  resource: FHIRPatient;
  constructor(resource: FHIRPatient) {
    this.resource = resource;
    console.log(this.resource);
  }
  /**
   * Gets the usual name, if possible. If no name exists on the record, returns
   * null. This prefers names in the order of usual, nickname, official.
   */
  getUsualName(): string | null {
    let name = this.getPreferredName();
    if (name == null) {
      return null;
    } else if (name.given && Array.isArray(name.given) && name.given.length > 0) {
      return name.given.join(' ');
    } else {
      return null;
    }
  }
  getPreferredName() {
    if (this.resource.name && Array.isArray(this.resource.name) && this.resource.name.length > 0) {
      // Pick out the "best" name if we can
      let name = null;
      for (let n of this.resource.name) {
        if (name == null) {
          name = n;
        } else {
          if (n.use in casualNamePreferences) {
            if (name.use in casualNamePreferences) {
              if (casualNamePreferences[n.use] > casualNamePreferences[name.use]) {
                name = n;
              }
            } else {
              // Prefer the name with a given use over the one without
              name = n;
            }
          }
        }
      }
      return name;
    } else {
      return null;
    }
  }
}
