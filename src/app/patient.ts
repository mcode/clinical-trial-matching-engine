// This provides a very basic patient object.

import { fhirclient } from 'fhirclient/lib/types';

type FHIRPatient = fhirclient.FHIR.Patient;

/** Maps name types to their "power" - higher is better (makes the comparison read better below) */
const casualNamePreferences = {
  'usual': 3,
  'nickname': 2,
  'official': 1
};

function objectComparator(usePreferences) {
  return (a, b) => {
    if (a.use in usePreferences) {
      if (b.use in usePreferences) {
        return usePreferences[a.use] > usePreferences[b.use] ? a : b;
      } else {
        return a;
      }
    } else if (b.use in casualNamePreferences) {
      // Return B if we know what its use is and we don't know what A's is
      return b;
    } else {
      // This returns B if it has a use and A doesn't, otherwise it
      // returns A because that means either both have a use and it isn't
      // a known use, or neither has a known use. In either case, return the
      // first one found in the record.
      return 'use' in b && !('use' in a) ? b : a;
    }
  };
}

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
    if (Array.isArray(this.resource.name) && this.resource.name.length > 0) {
      // Pick out the "best" name if we can
      return this.resource.name.reduce(objectComparator(casualNamePreferences));
    } else {
      return null;
    }
  }
  getHomePostalCode(): string | null {
    let address = this.getHomeAddress();
    return address ? address.postalCode : null;
  }
  getHomeAddress() {
    if (Array.isArray(this.resource.address) && this.resource.address.length > 0) {
      return this.resource.address.reduce(objectComparator({
        'home': 2,
        'office': 1
      }));
    }
  }
}
