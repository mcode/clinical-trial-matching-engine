/**
 * Minimal type definitions for fhirpath
 */
declare module 'fhirpath' {
  /**
   * FHIRPath is an opaque object.
   */
  export type FHIRPath = object;
  // This is effectively "any object"
  export type FHIRResource = { [key: string]: unknown };
  // This is almost certainly overly restrictive
  export type PathLookupResult = FHIRResource | string;

  export function parse(path: string): FHIRPath;
  export function compile(path: string, model: object): (resource: FHIRResource, context?: object) => PathLookupResult[];
  export function evaluate(resource: FHIRResource | FHIRResource[], path: string, context?: object, model?: object): PathLookupResult[];
}
