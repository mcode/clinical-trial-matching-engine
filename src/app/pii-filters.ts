/**
 * Module for filtering out PII as best as possible.
 *
 * Important caveat: This is a black-list based filter. It removes elements that
 * are known to contain PII. It does not attempt to search other elements for
 * PII.
 */

import { FhirFilter } from './fhir-filter';
import { Patient, Resource } from './fhir-types';
import { PatientBundle } from './bundle';

/**
 * Anonymize a date. If given a Date object, this assumes that the "local"
 * fields are the ones in use, not the UTC fields. This only matters for either
 * December 31st or January 1st dates, but as "year only" dates will be parsed
 * as being January 1 JavaScript Date objects, it's an important thing to note.
 *
 * @param date the date to anonymize
 * @param oldest if present, the oldest year to return (defaults to 90 years
 *     before today) - if given as a date, uses getFullYear() rather than
 *     getUTCFullYear()
 * @returns either the anonymized date OR the empty string if the date could not
 *     be parsed
 */
export function anonymizeDate(date: Date | string, oldest?: Date | number): string {
  // All we actually want out of the date is the year
  let year: number;
  if (typeof date === 'string') {
    const m = /^(\d+)\-?/.exec(date);
    if (m) {
      year = Number(m[1]);
    } else {
      return '';
    }
  } else {
    year = date.getFullYear();
  }
  return Math.max(
    oldest ? (typeof oldest === 'number' ? oldest : oldest.getFullYear()) : new Date().getFullYear() - 90,
    year
  ).toString();
}

export class PatientFilter extends FhirFilter {
  oldestPatientDate: Date;
  constructor() {
    super();
    // Maximum patient date is 90
    // This is stored mainly on the chance someone decides to run the filter at exactly midnight January 1st, that way
    // the results are consistent and won't change part-way through.
    // The use of getUTCFullYear() and new Date() IS INTENTIONAL - this strips the timezone from the year. The year
    // used by anonymizeDate() is the year in the Date object returned by getFullYear and NOT getUTCFullYear().
    this.oldestPatientDate = new Date(new Date().getUTCFullYear() - 89, 0, 1, 0, 0, 0, 0);
  }
  /**
   *
   * @param resource the resource to filter
   * @returns
   */
  filterResource(resource: Resource): Resource | null {
    // Only functions on Patient resources
    if (resource.resourceType !== 'Patient') return resource;
    // TODO: Rewrite ID? (references may need to be changed elsewhere in the bundle)
    const patient: Patient = resource;
    // Non-existent keys may be safely deleted - they just don't do anything
    // Delete any identifiers - they by definition are intended to identify the
    // patient and there's nothing to replace them with
    delete patient.identifier;
    // Replace the name with a temp name
    patient.name = [
      {
        use: 'anonymous',
        text: 'Anonymous',
        family: 'Anonymous',
        given: ['Anonymous']
      }
    ];
    delete patient.telecom;
    // TODO: If gender is not male/female/unknown (ie, "other"), should it be kept?
    if (patient.birthDate) {
      patient.birthDate = anonymizeDate(patient.birthDate, this.oldestPatientDate);
    }
    if (patient.deceasedDateTime) {
      patient.deceasedDateTime = anonymizeDate(patient.deceasedDateTime, this.oldestPatientDate);
    }
    // TODO: Anonymize addresses (could keep specific zip codes, for now, just delete)
    delete patient.address;
    // TODO?: maritalStatus?
    // TODO?: multipleBirth?
    delete patient.photo;
    delete patient.contact;
    delete patient.communication;
    delete patient.generalPractitioner;
    delete patient.managingOrganization;
    // FIXME: Or maybe rewrite the link?
    delete patient.link;
    return resource;
  }
}

/**
 * This class attempts to rewrite various parts of a patient bundle to
 * anonymize the entire bundle. It:
 *
 * - Replaces all IDs with incrementing integers based on the bundle type
 * - Deletes links from the bundle entries
 */
export class AnonymizeBundleFilter extends FhirFilter {
  currentId = 0;

  /**
   * Replaces the ID on the resource with an increasing integer. This is not
   * used by #filterBundle.
   * @param resource the resource to filter
   * @returns the resource
   */
  filterResource(resource: Resource): Resource | null {
    if (resource.id) {
      resource.id = (this.currentId++).toString();
    }
    return resource;
  }

  /**
   * Removes IDs
   *
   * @param bundle the bundle to filter
   * @returns the input bundle after removing parts
   */
  filterBundle(bundle: PatientBundle): PatientBundle {
    // Maps existing IDs to the newly generated IDs.
    const idMap = new Map<string, string>();
    let tempId = 0;
    delete bundle.identifier;
    delete bundle.link;
    delete bundle.signature;
    if (bundle.entry) {
      for (const entry of bundle.entry) {
        if (entry.resource && entry.resource.id) {
          const newId = (tempId++).toString();
          idMap.set(entry.resource.id, newId);
          entry.resource.id = newId;
        }
        delete entry.fullUrl;
        delete entry.link;
        delete entry.request;
        delete entry.response;
      }
    }
    // TODO: Attempt to replace any references to the old IDs with references to the new IDs
    // (That's what idMap is for)
    return bundle;
  }
}

/**
 * This filter is essentially "all the PII filters at once," running the bundle first through the AnonymizeBundleFilter
 * and then individual resource-specific filters as necessary.
 */
export class AnonymizeFilter extends FhirFilter {
  patientFilter = new PatientFilter();
  bundleFilter = new AnonymizeBundleFilter();

  /**
   * Invokes filterResource on the child filters.
   * @param resource the resource to filter
   * @returns the resource
   */
  filterResource(resource: Resource): Resource | null {
    this.bundleFilter.filterResource(resource);
    this.patientFilter.filterResource(resource);
    return resource;
  }

  /**
   * Filters the bundle.
   *
   * @param bundle the bundle to filter
   * @returns the input bundle after removing parts
   */
  filterBundle(bundle: PatientBundle): PatientBundle {
    this.bundleFilter.filterBundle(bundle);
    // Then go through the individual resources and selectively send them off as appropriate
    if (bundle.entry) {
      for (const entry of bundle.entry) {
        if (entry.resource?.resourceType === 'Patient') {
          this.patientFilter.filterResource(entry.resource);
        }
      }
    }
    return bundle;
  }
}
