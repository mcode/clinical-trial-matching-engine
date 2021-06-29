/**
 * Module for filtering out PII as best as possible.
 *
 * Important caveat: This is a black-list based filter. It removes elements that
 * are known to contain PII. It does not attempt to search other elements for
 * PII.
 */

import { FhirFilter } from './fhir-filter';
import { JsonObject, Patient, Resource, Reference } from './fhir-types';
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

/**
 * Removes PII fields from patient records. It does this by using anonymizeDate (based on oldestPatientDate) to
 * anonymize dates within the record (specifically birthDate and deceasedDateTime). It replaces all names with a single
 * name ("Anonymous") and removes the following fields:
 *
 * identifier, telecom, address, photo, contact, communication, generalPractitioner, managingOrganization, link
 */
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

// As it currently stands it's kind of pointless to have this be its own filter but it's not really attached to any
// other part of the process and it's possible that it may be improved in the future. Right now it just deletes the
// "note" field. There may be other places for annotations to reside and it may turn out to make more sense to restrict
// it only to resources that can actually have a note attached.
/**
 * Removes any "note" field from input resources.
 */
export class AnnotationFilter extends FhirFilter {
  constructor() {
    super();
  }
  /**
   * Deletes the "note" field.
   * @param resource the resource to filter
   * @returns
   */
  filterResource(resource: Resource): Resource | null {
    delete resource.note;
    return resource;
  }
}

/**
 * Known paths to references. Keys are resource types, values are an array of paths to all types within that resource
 * type.
 */
const REFERENCE_PATHS: Record<string, Array<string | Array<string>>> = {
  Condition: ['subject', 'encounter', 'recorder', 'asserter', ['stage', 'assessment'], ['evidence', 'detail']],
  MedicationStatement: [
    'basedOn',
    'partOf',
    'medicationReference',
    'informationSource',
    'derivedFrom',
    'reasonReference'
  ],
  Observation: [
    'basedOn',
    'partOf',
    'subject',
    'focus',
    'encounter',
    'performer',
    'specimen',
    'device',
    'hasMember',
    'derivedFrom'
  ],
  Procedure: [
    'basedOn',
    'partOf',
    'subject',
    'encounter',
    'recorder',
    'asserter',
    ['performer', 'actor'],
    ['performer', 'onBehalfOf'],
    'location',
    'reasonReference',
    'report',
    'complicationDetail',
    ['focalDevice', 'manipulated'],
    'usedReference'
  ]
};

/**
 * Updates all references within a given object, removing any external references or references that do not refer to a
 * known ID. Exported for testing purposes.
 * @param object the object to update
 * @param path the path being checked
 * @param idMap a map of IDs to use
 * @param idx the index to use
 * @returns true if the reference was updated, false if it should be removed
 */
export function updateReferences(
  object: JsonObject,
  path: string | Array<string>,
  idMap: Map<string, string>,
  idx = 0
): boolean {
  // If this is past the end of the path, the object should be the reference we want to replace
  if (typeof path === 'string' ? idx > 0 : idx >= path.length) {
    if (typeof object !== 'object' || object === null || Array.isArray(object)) {
      // Not an object we can handle, abort
      // (true indicates it should be left alone but the object is actually invalid)
      return true;
    }
    const reference = object as Reference;
    // See if this is an internal reference
    if (reference.reference && reference.reference[0] === '#') {
      // Internal resource, update the ID
      const existingId = reference.reference.substring(1);
      const newId = idMap.get(existingId);
      if (newId === undefined) {
        // If the new ID does not map anywhere, flag this for removal
        return false;
      } else {
        reference.reference = '#' + newId;
      }
      // For now, delete the display text and the identifier because that could contain PII
      delete reference.identifier;
      delete reference.display;
      return true;
    } else {
      // If this reference cannot be handled, indicate it should be removed
      return false;
    }
  }
  // The vast majority of references are single string paths
  const currentPath = typeof path === 'string' ? path : path[idx];
  // Move path index up since we have the current path now
  idx++;
  if (!(currentPath in object)) {
    // If the path doesn't exist, just give up
    return true;
  }
  const value = object[currentPath];
  // And now handle the value. By definition we're not at the end of the path if here.
  if (Array.isArray(value)) {
    // Go through each instance of the object and recurse
    let needsFiltering = false;
    value.forEach((child, childIdx) => {
      if (typeof child === 'object' && child !== null) {
        if (!updateReferences(child as JsonObject, path, idMap, idx)) {
          // This indicates it should be removed - for now, mark it undefined
          needsFiltering = true;
          value[childIdx] = undefined;
        }
      }
    });
    if (needsFiltering) {
      const filtered = value.filter((value) => value !== undefined);
      object[currentPath] = filtered;
      // If we emptied the array, return false to indicate it should be removed
      return filtered.length > 0;
    }
    return true;
  } else if (typeof value === 'object' && value !== null) {
    // Simpler
    if (updateReferences(value as JsonObject, path, idMap, idx)) {
      return true;
    } else {
      delete object[currentPath];
      // If the child was removed, then this object should be removed if there are no more properties on it
      return Object.keys(object).length > 0;
    }
  } else {
    // In this case, the value is something we can't handle (and is likely invalid FHIR)
    return true;
  }
}

/**
 * This class attempts to rewrite various parts of a patient bundle to
 * anonymize the entire bundle. It:
 *
 * - Replaces all IDs with incrementing integers
 * - Rewrites all internal references to use these new IDs
 * - Removes all other references
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
    delete bundle.identifier;
    delete bundle.link;
    delete bundle.signature;
    if (bundle.entry) {
      // Maps existing IDs to the newly generated IDs.
      const idMap = new Map<string, string>();
      let tempId = 0;
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
      // Attempt to replace any references to the old IDs with references to the new IDs
      for (const entry of bundle.entry) {
        // See if we know about references within this resource type
        if (entry.resource && entry.resource.resourceType in REFERENCE_PATHS) {
          const resource = entry.resource;
          const paths = REFERENCE_PATHS[resource.resourceType];
          for (const path of paths) {
            updateReferences(resource, path, idMap);
          }
        }
      }
    }
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
  annotationFilter = new AnnotationFilter();

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
        if (entry.resource) {
          if (entry.resource.resourceType === 'Patient') {
            this.patientFilter.filterResource(entry.resource);
          }
          this.annotationFilter.filterResource(entry.resource);
        }
      }
    }
    return bundle;
  }
}
