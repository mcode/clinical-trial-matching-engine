import { FhirPathFilter, FhirComponentPathFilter, FhirFilter } from '../fhir-filter';

export const FILTERS: { [key: string]: FhirFilter } = {
  Stage: new FhirPathFilter(
    'Condition.meta.where(' +
      "profile = 'http://hl7.org/fhir/us/mcode/StructureDefinition/mcode-primary-cancer-condition'" +
      "or profile = 'http://hl7.org/fhir/us/mcode/StructureDefinition/mcode-tnm-patholical-stage-group')"
  ),
  'Cancer subtype': new FhirComponentPathFilter(
    'Condition.extension',
    "url = 'http://hl7.org/fhir/us/mcode/StructureDefinition/mcode-histology-morphology-behavior'"
  ),
  Biomarker: new FhirPathFilter(
    "Observation.meta.where(profile = 'http://hl7.org/fhir/us/mcode/StructureDefinition/mcode-tumor-marker'" +
      "or profile = 'http://hl7.org/fhir/us/mcode/StructureDefinition/mcode-cancer-genetic-variant')"
  ),
  'ECOG score': new FhirPathFilter(
    "Observation.meta.where(profile = 'http://hl7.org/fhir/us/mcode/StructureDefinition/mcode-ecog-performance-status')"
  ),
  'Karnofsky score': new FhirPathFilter(
    "Observation.meta.where(profile = 'http://hl7.org/fhir/us/mcode/StructureDefinition/mcode-karnofsky-performance-status')"
  )
};

export default FILTERS;
