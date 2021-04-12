/**
 * This provides a very basic patient object. It's not a full FHIR type, but
 * instead provides hooks sufficient to pull the data used.
 */

import { Address, HumanName, Patient as FHIRPatient } from './fhir-types';

export type NameUse = HumanName['use'];

/** Maps name types to their "power" - higher is better (makes the comparison read better below) */
const casualNamePreferences: { [K in NameUse]?: number } = {
  usual: 3,
  nickname: 2,
  official: 1
};

interface ObjectWithUse {
  use?: string;
}

function objectComparator<T extends ObjectWithUse>(usePreferences: { [key: string]: number }): (a: T, b: T) => T {
  return (a, b): T => {
    if (!('use' in a)) {
      // If a has no use and b has a use, prefer b, otherwise return a as "first"
      return 'use' in b ? b : a;
    }
    if (!('use' in b)) {
      // If a has a use and b did not, use a
      return a;
    }
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
  }
  /**
   * Gets the usual name, if possible. If no name exists on the record, returns
   * null. This prefers names in the order of usual, nickname, official.
   */
  getUsualName(): string | null {
    const name = this.getPreferredName();
    if (name === null) {
      return null;
    } else if (name.given && Array.isArray(name.given) && name.given.length > 0) {
      return name.given.join(' ');
    } else {
      return null;
    }
  }
  /**
   * Looks up the preferred full name, if one exists.
   * @returns the preferred full name, if possible
   */
  getFullName(): string | null {
    const name = this.getPreferredName();
    if (name === null) {
      return null;
    } else {
      const fullName = [];
      if (name.given) {
        fullName.push(...name.given);
      }
      if (name.family) {
        fullName.push(name.family);
      }
      return fullName.length > 0 ? fullName.join(' ') : null;
    }
  }
  /**
   * Gets the "best" name, if possible. If no name exists on the record, returns
   * null. This returns names based on the use field in the order of usual,
   * nickname, official. If there are no names with those defined uses, it
   * returns the first name with a defined "use" field, otherwise, it returns
   * the first name.
   */
  getPreferredName(): HumanName {
    if (Array.isArray(this.resource.name) && this.resource.name.length > 0) {
      // Pick out the "best" name if we can
      return this.resource.name.reduce(objectComparator(casualNamePreferences));
    } else {
      return null;
    }
  }
  getGender(): FHIRPatient['gender'] {
    return this.resource.gender;
  }
  getAge(): number {
    return new Date().getFullYear() - new Date(this.resource.birthDate).getFullYear();
  }
  /**
   * Returns the postal code from the address returned by getHomeAddress, if any.
   */
  getHomePostalCode(): string | null {
    const address = this.getHomeAddress();
    return address ? address.postalCode : null;
  }
  /**
   * Gets the home address, if available, otherwise an office address, otherwise
   * the first address of any type listed in the patient record.
   */
  getHomeAddress(): Address | null {
    if (Array.isArray(this.resource.address) && this.resource.address.length > 0) {
      return this.resource.address.reduce(
        objectComparator({
          home: 2,
          office: 1
        })
      );
    } else {
      return null;
    }
  }
}
