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

// FHIR dates are strings in a specific format
export type FHIRDate = string;

export function parseFHIRDate(date: FHIRDate): Date {
  // Technically leading 0s are disallowed
  const m = /^([0-9]{4})(-[0-9]{1,2})?(-[0-9]{1,2})?$/.exec(date);
  if (m) {
    return new Date(Number(m[1]), m[2] ? Number(m[2]) : 0, m[3] ? Number(m[3]) : 1);
  } else {
    throw new Error(`Invalid date: ${date}`);
  }
}

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
export interface ContactDetail extends Element {
  name?: string;
  telecom?: ContactPoint[];
}
export interface ContactPoint extends Element {
  system?: 'phone' | 'fax' | 'email' | 'pager' | 'url' | 'sms' | 'other';
  value?: string;
  use?: 'home' | 'work' | 'temp' | 'old' | 'mobile';
  rank?: number;
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

interface Arm extends BackboneElement {
  name: string;
  type?: CodeableConcept;
  description?: string;
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
  protocol?: Reference<PlanDefinition>[];
  arm?: Arm[];
  contact?: ContactDetail[];
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
  birthDate?: FHIRDate;
  address?: Address[];
}

// These exist if we ever intend to expand the type definitions for them, but are presently mostly useless
export interface Condition extends Resource {
  resourceType: 'Condition';
}

export interface Observation extends Resource {
  resourceType: 'Observation';
}

export interface Procedure extends Resource {
  resourceType: 'Procedure';
}

export interface MedicationStatement extends Resource {
  resourceType: 'MedicationStatement';
}

export interface PlanDefinition extends Resource {
  resourceType: 'PlanDefinition';
  status: 'draft' | 'active' | 'retired' | 'unknown';
  type?: CodeableConcept;
  title?: string;
  subtitle?: string;
  description?: string;
  subjectCodeableConcept?: CodeableConcept;
}
