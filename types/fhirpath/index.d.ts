/**
 * Minimal type definitions for fhirpath
 */
declare namespace fhirpath {
  type FHIRPath = string;
  type ApplyParsedPathResult = unknown;

  function parse(path: FHIRPath): ApplyParsedPathResult;
  function compile(path: FHIRPath, model: object): (resource, context) => ApplyParsedPathResult;
  function evaluate(resource: object | object[], path: string, context: object, model: object): ApplyParsedPathResult;
}
