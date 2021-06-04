/**
 * Module to remove elements from FHIR records.
 */

import { PatientBundle } from './bundle';
import { CodeableConcept, Coding, Resource } from './fhir-types';
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

type CompiledPath = (resource: fhirpath.FHIRResource, context?: object) => fhirpath.PathLookupResult[];

export type MatchMode = 'any' | 'all';

export interface PathFilterOptions {
  include?: string[] | string;
  includeMode?: MatchMode;
  exclude?: string[] | string;
  excludeMode?: MatchMode;
  order?: 'include,exclude' | 'exclude,include';
}

function compilePaths(paths?: string[] | string): CompiledPath[] {
  if (paths) {
    return Array.isArray(paths) ? paths.map((path) => fhirpath.compile(path)) : [fhirpath.compile(paths)];
  } else {
    return [];
  }
}

function matchPaths(paths: CompiledPath[], all: boolean, resource: fhirpath.FHIRResource): boolean {
  if (all) {
    // All paths must match
    for (const path of paths) {
      if (path(resource).length === 0) return false;
    }
    return true;
  } else {
    // At least one path must match
    for (const path of paths) {
      if (path(resource).length > 0) return true;
    }
    return false;
  }
}

export class PathFilter {
  private _include: CompiledPath[];
  private _exclude: CompiledPath[];
  private includeAll: boolean;
  private excludeAll: boolean;
  private includeFirst: boolean;
  constructor(options: PathFilterOptions) {
    this._include = compilePaths(options.include);
    this._exclude = compilePaths(options.exclude);
    this.includeAll = options.includeMode === 'all';
    this.excludeAll = options.excludeMode === 'all';
    this.includeFirst = options.order !== 'exclude,include';
  }

  matches(resource: fhirpath.FHIRResource): boolean {
    if (this.includeFirst) {
      if (!this.included(resource)) return false;
      return !this.excluded(resource);
    } else {
      if (this.excluded(resource)) return false;
      return this.included(resource);
    }
  }

  /**
   * Determine if a resource is included. A resource is included if there are any inclusion criteria and they match
   * given the match mode.
   * @param resource
   * @returns
   */
  included(resource: fhirpath.FHIRResource): boolean {
    return this._include.length === 0 ? true : matchPaths(this._include, this.includeAll, resource);
  }

  excluded(resource: fhirpath.FHIRResource): boolean {
    return this._exclude.length === 0 ? false : matchPaths(this._exclude, this.excludeAll, resource);
  }
}

/**
 * Options for the component filter.
 */
export interface FhirComponentFilterMatchOptions {
  /**
   * Filter to match against the element being selected. Elements that match this filter will be removed, elements that
   * do not match will be left as-is.
   */
  element?: PathFilterOptions | PathFilter | string;
  /**
   * Filter to match against resources. Components will only be removed from resources that match this filter - any
   * other resource will be left unchanged but NOT removed.
   */
  resource?: PathFilterOptions | PathFilter | string;
}

function parseFilter(o: PathFilterOptions | PathFilter | string | undefined): PathFilter | undefined {
  if (o === undefined) {
    return undefined;
  } else if (typeof o === 'string') {
    return new PathFilter({ include: o });
  } else if (o instanceof PathFilter) {
    return o;
  } else {
    return new PathFilter(o);
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
  _elementFilter?: PathFilter;
  _resourceFilter?: PathFilter;
  /**
   * Filters out individual elements.
   * @param elementPath the path to the element that may be removed
   * @param options options for this filter
   */
  constructor(elementPath: string, options: FhirComponentFilterMatchOptions) {
    super();
    this.elementPath = elementPath;
    this._elementFilter = parseFilter(options.element);
    this._resourceFilter = parseFilter(options.resource);
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
    // Next up see if we have filters that may de-select this option
    if (this._resourceFilter) {
      if (!this._resourceFilter.matches(resource)) return resource;
    }
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
      // If the filter includes this component, always remove it
      return this._elementFilter ? this._elementFilter.matches(component) : true;
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
 * Extension of the FhirFilter that runs input through multiple other filters.
 */
export class FhirMultiFilter extends FhirFilter {
  private filters: FhirFilter[];
  constructor(...filters: FhirFilter[]) {
    super();
    this.filters = filters;
    // For now, allow empty filters
  }

  addFilter(filter: FhirFilter): void {
    this.filters.push(filter);
  }

  /**
   * This runs the given resource through all child filters, returning null
   * immediately if any are null. Note: this is not called by #filterBundle
   * in this implementation!
   *
   * @param resource the resource
   * @returns the modified resource, or null to exclude the resource entirely
   */
  filterResource(resource: Resource): Resource | null {
    for (const filter of this.filters) {
      if (filter.filterResource(resource) === null) return null;
    }
    return resource;
  }

  /**
   * Passes the given bundle through all filters in this filter in order. Each
   * filter is allowed to pass over the entire bundle.
   *
   * @param bundle the bundle to filter
   * @returns the input bundle after removing parts
   */
  filterBundle(bundle: PatientBundle): PatientBundle {
    for (const filter of this.filters) {
      filter.filterBundle(bundle);
    }
    return bundle;
  }
}

interface Code {
  system: string;
  code: string;
  display?: string;
}

type CodeMapping = [Code, Code];
/**
 * This filter maps a given set of codes to other codes.
 */
export class FhirCodeRemapFilter extends FhirFilter {
  resourceType: string;
  profile: string;
  codeMapping: CodeMapping[];
  constructor(resourceType: string, profile: string, codeMapping: CodeMapping[]) {
    super();
    this.resourceType = resourceType;
    this.profile = profile;
    this.codeMapping = codeMapping;
  }
  filterResource(resource: Resource): Resource {
    // Only target condition resources
    if (resource.resourceType !== this.resourceType) return resource;
    // See if the profile matches
    if (resource.meta && resource.meta.profile) {
      if (!resource.meta.profile.includes(this.profile)) return resource;
    }
    // If it does, see if there are codes that can be altered
    if ('code' in resource) {
      const code: CodeableConcept = resource['code'];
      // Everything in the codeable concept turns out to be optional anyway...
      if (code.coding && Array.isArray(code.coding)) {
        code.coding.forEach((o) => {
          // Coding is where the actual mapping happens.
          if (typeof o === 'object' && o !== null) {
            const coding: Coding = o;
            // Because the code mapping is a tuple (sort of) we have to go through it sequentially
            for (const [from, to] of this.codeMapping) {
              if (from.system === coding.system && from.code === coding.code) {
                // Got a match
                coding.system = to.system;
                coding.code = to.code;
                if (to.display) {
                  coding.display = to.display;
                }
                break;
              }
            }
          }
        });
      }
    }
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
