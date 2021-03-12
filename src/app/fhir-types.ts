/**
 * This module contains basic types for FHIR elements. These types are
 * incomplete but are used solely to mark types used within this app.
 * At some point this may be replaced with a "real" set of FHIR types.
 *
 * Note: there are a set of partiant FHIR types within the "fhirclient" library,
 * however, those define what the FHIR client will return, meaning that they
 * indicate certain data elements are required (because they'll always be
 * returned) that are not truly required.
 */

export type JsonObject = Record<string, unknown>;

export interface BackboneElement extends JsonObject {
  // Currently intentionally empty, should hold modifierExtension
}

export interface Resource extends JsonObject {
  resourceType: string;
  meta?: Meta;
  id?: string;
}

export type instant = string;

/**
 * URL to a structure definition.
 */
export type CanonicalStructureDefinition = string;

export interface Meta {
  versionId?: string;
  lastUpdated?: instant;
  profile?: CanonicalStructureDefinition[];
}

export interface BundleEntry extends BackboneElement {
  fullUrl?: string;
  resource?: Resource;
}

export interface Bundle extends Resource {
  resourceType: 'Bundle';
  type:
    | 'document'
    | 'message'
    | 'transaction'
    | 'transaction-response'
    | 'batch'
    | 'batch-response'
    | 'history'
    | 'searchset'
    | 'collection';
  entry?: BundleEntry[];
}
