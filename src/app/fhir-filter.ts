/**
 * Module to remove elements from FHIR records.
 */

import { PatientBundle } from './bundle';
import { Resource } from './fhir-types';
import * as fhirpath from 'fhirpath';

/**
 * A filter that can filter data out of resources or resource bundles.
 */
export class FhirFilter {
  constructor() {}

  /**
   * Filters data out from the given resource. This modifies the given resource
   * in-place - the returned object is the same object as given. If the resource
   * should be excluded entirely, the filter may return null.
   *
   * @param resource the resource
   * @returns the modified resource, or null to exclude the resource entirely
   */
  filterResource(resource: Resource): Resource | null {
    return resource;
  }

  /**
   * Filters entries out of the given bundle. This will modify the given bundle
   * in-place - the returned object is the same object as given.
   *
   * The default implementation goes through all the resources within the bundle
   * and passes them through filterResource, removing any that filterResource
   * returns null for.
   *
   * @param bundle the bundle to filter
   * @returns the input bundle after removing parts
   */
  filterBundle(bundle: PatientBundle): PatientBundle {
    if (bundle.entry) {
      // Because we can remove entries, we have to actually step through with an
      // actual index
      for (let idx = 0; idx < bundle.entry.length; idx++) {
        const r = this.filterResource(bundle.entry[idx].resource);
        if (r === null) {
          // Remove the resource
          bundle.entry.splice(idx, 1);
          // And move back an index so idx++ moves on to the next one
          idx--;
        }
      }
    }
    return bundle;
  }
}

/**
 * A filter which removes records that match a given FHIR path.
 */
export class FhirPathFilter extends FhirFilter {
  _path: (resource: fhirpath.FHIRResource, context?: object) => fhirpath.PathLookupResult[];
  _pathStr: string;
  constructor(path: string) {
    super();
    // Invoke the setter to set the actual path
    this.path = path;
  }

  get path(): string {
    return this._pathStr;
  }

  set path(value: string) {
    this._path = fhirpath.compile(value);
    // Only if the FHIR path compiled set the string value
    this._pathStr = value;
  }

  filterResource(resource: Resource): Resource | null {
    if (this._path(resource).length > 0) return null;
    else return resource;
  }
}

/**
 * Filter that removes a specific part of a FHIR record assuming that part
 * matches the given path. The path is a FHIR path for just the component, the
 * component path is technically not a FHIR path in that it's evaluated
 * internally as the structure needs to be determined.
 */
export class FhirComponentPathFilter extends FhirFilter {
  _elementPath: string[];
  _matchPath: (resource: fhirpath.FHIRResource, context?: object) => fhirpath.PathLookupResult[];
  _matchPathStr: string;
  constructor(elementPath: string, matchPath: string) {
    super();
    this.elementPath = elementPath;
    this.matchPath = matchPath;
  }

  get elementPath(): string {
    return this._elementPath.join('.');
  }

  set elementPath(value: string) {
    if (value.length === 0) throw new Error('Empty string is not a valid path');
    const parts = value.split('.');
    for (const part of parts) {
      if (part.length === 0) throw new Error('Empty path component in ' + value);
    }
    this._elementPath = parts;
  }

  get matchPath(): string {
    return this._matchPathStr;
  }

  set matchPath(value: string) {
    this._matchPath = fhirpath.compile(value);
    this._matchPathStr = value;
  }

  /**
   * Filters data out from the given resource. This modifies the given resource
   * in-place - the returned object is the same object as given. This will never
   * entirely remove a resource.
   *
   * @param resource the resource
   * @returns the modified resource
   */
  filterResource(resource: Resource): Resource {
    // First, see if this resource matches as all - first part of the path is
    // the resource type
    if (resource.resourceType !== this._elementPath[0]) return resource;
    // Next, follow the path to get the actual components
    return this._filterResource(1, resource) ? null : resource;
  }

  /**
   * Actual implementation of the filter.
   * @param idx the index of the path to traverse
   * @param component the component to check
   * @returns whether or not this component should be removed entirely - true
   * means remove, false means keep
   */
  private _filterResource(idx: number, component: { [key: string]: unknown }): boolean {
    // If we've gone past the end of the path, we're looking at an element we
    // may or may not want to remove.
    if (idx >= this._elementPath.length) {
      // Tell the parent to remove if the FHIR path hits results
      return this._matchPath(component).length > 0;
    }
    // Otherwise, find the part
    const key = this._elementPath[idx];
    if (key in component) {
      const value = component[key];
      if (typeof value === 'object' && value) {
        if (Array.isArray(value)) {
          // Important special case: iterate over each child
          const childPathIdx = idx + 1;
          for (let childElementIdx = 0; childElementIdx < value.length; childElementIdx++) {
            const child = value[childElementIdx];
            // Same restrictions apply as above
            if (typeof child === 'object' && child) {
              if (Array.isArray(child)) {
                // This is likely invalid FHIR. In any case, we can't remove it,
                // so just skip past it.
                continue;
              }
              if (this._filterResource(childPathIdx, child)) {
                // true means remove child, which means modifying the array
                value.splice(childElementIdx, 1);
                // Move backwards one index so the next loop gets the next index
                childElementIdx--;
              }
            }
          }
          // If empty, remove the key
          if (value.length === 0) {
            delete component[key];
          }
        } else {
          // This version is much easier:
          if (this._filterResource(idx + 1, value as { [key: string]: unknown })) {
            delete component[key];
          }
        }
      }
    }
    return false;
  }
}

/**
 * Creates a deep clone of an object, copying all keys and creating new copies of all values.
 *
 * This works by simply doing JSON.parse(JSON.stringify(record)). It is intended for use cases where that is valid.
 * It does not attempt to copy prototypes or property definitions or anything like that.
 *
 * @param record the record to clone
 * @returns a copy of the record
 */
export function deepClone<T>(record: T[]): T[];
export function deepClone<T>(record: T): T;
export function deepClone(record: object): object {
  return JSON.parse(JSON.stringify(record));
}
