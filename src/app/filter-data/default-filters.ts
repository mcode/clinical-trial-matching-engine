import {
  FhirPathFilter,
  FhirCodeRemapFilter,
  FhirComponentPathFilter,
  FhirMultiFilter,
  FhirFilter
} from '../fhir-filter';

const SNOMED_SYSTEM = 'http://snomed.info/sct';

export const FILTERS: { [key: string]: FhirFilter } = {
  Stage: new FhirPathFilter(
    'Observation.meta.where(' +
      "profile = 'http://hl7.org/fhir/us/mcode/StructureDefinition/mcode-tnm-clinical-stage-group')"
  ),
  'Cancer subtype': new FhirMultiFilter(
    new FhirComponentPathFilter(
      'Condition.extension',
      "url = 'http://hl7.org/fhir/us/mcode/StructureDefinition/mcode-histology-morphology-behavior'"
    ),
    new FhirCodeRemapFilter(
      'Condition',
      'http://hl7.org/fhir/us/mcode/StructureDefinition/mcode-primary-cancer-condition',
      [
        [
          {
            system: SNOMED_SYSTEM,
            code: '408643008'
          },
          {
            system: SNOMED_SYSTEM,
            code: '254837009',
            display: 'Malignant neoplasm of breast'
          }
        ],
        [
          {
            system: SNOMED_SYSTEM,
            code: '278054005'
          },
          {
            system: SNOMED_SYSTEM,
            code: '254837009',
            display: 'Malignant neoplasm of breast'
          }
        ]
      ]
    )
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
