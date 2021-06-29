/**
 * This provides a very basic patient object. It's not a full FHIR type, but
 * instead provides hooks sufficient to pull the data used.
 */

import { Address, HumanName, parseFHIRDate, Patient as FHIRPatient } from './fhir-types';
import { fhirclient } from 'fhirclient/lib/types';

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

/**
 * Utility function to calculate age. (This exists more to make testing it easier
 * than anything else.)
 * @param birthDate the birth date
 * @param date if given, the time to calculate the age as of
 */
export function calculateAge(birthDate: Date, date?: Date): number {
  // Default to now if no date given
  if (!date) date = new Date();
  // Go ahead and do this in the local time zone
  let age = date.getFullYear() - birthDate.getFullYear();
  // This is potentially wrong - we need to see if we're before the actual birth day in the year
  if (
    date.getMonth() < birthDate.getMonth() ||
    (date.getMonth() === birthDate.getMonth() && date.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
}

/**
 * This class provides convenience methods for pulling patient information from a FHIR patient record.
 */
export default class Patient {
  /**
   * The underlying FHIR resource.
   */
  resource: FHIRPatient;
  constructor(resource: FHIRPatient | fhirclient.FHIR.Patient) {
    // The fhirclient Patient type indicates that meta.lastUpdated is required, by which is really means that it's
    // guaranteed to be filled out by the client, which causes type issues elsewhere, so accept both and "cast" to the
    // "real" FHIR type which contains more information about how a patient looks.
    this.resource = resource as FHIRPatient;
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
  /**
   * Returns the patient's age, if known
   * @returns the patient's age, if known
   */
  getAge(): number | undefined {
    if (this.resource.birthDate) {
      try {
        return calculateAge(parseFHIRDate(this.resource.birthDate));
      } catch (ex) {
        console.log(`Error calculating age: ${ex}`);
        return undefined;
      }
    } else {
      return undefined;
    }
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
