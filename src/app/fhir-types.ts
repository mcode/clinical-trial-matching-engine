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

export interface Element extends JsonObject {
  id?: string;
}
export interface BackboneElement extends Element {
  // Currently intentionally empty, should hold modifierExtension
}

export interface Resource extends JsonObject {
  resourceType: string;
  meta?: Meta;
  id?: string;
}

export interface Reference<T extends Resource = Resource> {
  reference?: string;
  type?: T['resourceType'];
  identifier?: string;
  display?: string;
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

export interface Coding {
  system?: string;
  version?: string;
  code?: string;
  display?: string;
  userSelected?: boolean;
}
export interface CodeableConcept {
  coding?: Coding[];
  text?: string;
}

export interface Search extends BackboneElement {
  mode?: 'match' | 'include' | 'outcome';
  score?: number;
}

export interface BundleEntry extends BackboneElement {
  fullUrl?: string;
  resource?: Resource;
  search?: Search;
}
export interface Identifier extends Element {
  use?: 'usual' | 'official' | 'temp' | 'secondary' | 'old';
  type?: CodeableConcept;
  system?: string;
  value?: string;
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

export interface DomainResource extends Resource {
  contained?: Resource[];
}

interface GroupCharacteristicBase extends BackboneElement {
  code: CodeableConcept;
  exclude: boolean;
  valueCodeableConcept?: CodeableConcept;
  valueBoolean?: boolean;
  valueReference?: Reference;
}

// There unfortunately does not appear to be any way in TypeScript to say
// "one and only one of these fields is required." There is a way to require at
// least one, as explained in:
// https://stackoverflow.com/questions/40510611/typescript-interface-require-one-of-two-properties-to-exist/49725198#49725198
// But for now, just use the type with all of them
export type GroupCharacteristic = GroupCharacteristicBase;
export interface Group extends DomainResource {
  resourceType: 'Group';
  characteristic?: GroupCharacteristic[];
}
export interface ResearchStudy extends DomainResource {
  resourceType: 'ResearchStudy';
  identifier?: Identifier[];
  status:
    | 'active'
    | 'administratively-completed'
    | 'approved'
    | 'closed-to-accrual'
    | 'closed-to-accrual-and-intervention'
    | 'completed'
    | 'disapproved'
    | 'in-review'
    | 'temporarily-closed-to-accrual'
    | 'temporarily-closed-to-accrual-and-intervention'
    | 'withdrawn';
  category?: CodeableConcept[];
  enrollment?: Reference<Group>[];
}

export interface Address extends Element {
  use: 'home' | 'work' | 'temp' | 'old' | 'billing';
  postalCode?: string;
}

export interface HumanName extends Element {
  use?: 'usual' | 'official' | 'temp' | 'nickname' | 'anonymous' | 'old' | 'maiden';
  text?: string;
  family?: string;
  given?: string[];
  prefix?: string[];
  suffix?: string[];
}

export interface Patient extends DomainResource {
  name?: HumanName[];
  gender?: 'male' | 'female' | 'other' | 'unknown';
  birthDate?: Date;
  address?: Address[];
}
