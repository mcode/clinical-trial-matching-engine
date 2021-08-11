import { fhirclient } from 'fhirclient/lib/types';
import * as fhirpath from 'fhirpath';

import * as fhir from './fhir-types';

export type FHIRPath = string;

export class OPDEStrings {
  originalBundle: fhir.Bundle;
  primaryCancerCondition: string[];
  secondaryCancerCondition: string[];
  birthDate: string;
  tumorMarker: string[];
  cancerGeneticVariant: string[];
  cancerRelatedMedicationStatement: string[];
  ecogPerformaceStatus: number;
  karnofskyPerformanceStatus: number;

  constructor(patientBundle: fhir.Bundle) {
    if (patientBundle != null) {
      this.originalBundle = patientBundle;
      for (const entry of patientBundle.entry) {
        if (!('resource' in entry)) {
          // Skip bad entries
          continue;
        }
        const resource = entry.resource as fhirclient.FHIR.Resource;

        if (
          resource.resourceType === 'Condition' &&
          this.resourceProfile(this.lookup(resource, 'meta.profile'), 'mcode-primary-cancer-condition')
        ) {
          const tempPrimaryCancerCondition = this.lookup(resource, 'code.coding.display') as string[];
          if (this.primaryCancerCondition) {
            this.primaryCancerCondition.push(...tempPrimaryCancerCondition);
          } else {
            this.primaryCancerCondition = tempPrimaryCancerCondition;
          }
        }

        if (
          resource.resourceType === 'Condition' &&
          this.resourceProfile(this.lookup(resource, 'meta.profile'), 'mcode-secondary-cancer-condition')
        ) {
          const tempSecondaryCancerCondition = this.lookup(resource, 'code.coding') as string[];
          if (this.secondaryCancerCondition) {
            this.secondaryCancerCondition.push(...tempSecondaryCancerCondition);
          } else {
            this.secondaryCancerCondition = tempSecondaryCancerCondition;
          }
        }

        if (
          resource.resourceType === 'Patient' &&
          this.resourceProfile(this.lookup(resource, 'meta.profile'), 'mcode-cancer-patient')
        ) {
          if (this.lookup(resource, 'birthDate').length !== 0) {
            this.birthDate = this.lookup(resource, 'birthDate')[0] as string;
          } else {
            this.birthDate = 'NA';
          }
        }

        if (
          resource.resourceType === 'Observation' &&
          this.resourceProfile(this.lookup(resource, 'meta.profile'), 'mcode-tumor-marker')
        ) {
          const tempTumorMarker = this.lookup(resource, 'code.coding') as string[];
          if (this.tumorMarker) {
            this.tumorMarker.push(...tempTumorMarker);
          } else {
            this.tumorMarker = tempTumorMarker;
          }
        }

        if (
          resource.resourceType === 'Observation' &&
          this.resourceProfile(this.lookup(resource, 'meta.profile'), 'mcode-cancer-genetic-variant')
        ) {
          const tempCGV = this.lookup(resource, 'code.coding') as string[]; // not used in logic
          if (this.cancerGeneticVariant) {
            this.cancerGeneticVariant.push(...tempCGV);
          } else {
            this.cancerGeneticVariant = tempCGV;
          }
        }

        if (
          resource.resourceType === 'MedicationStatement' &&
          this.resourceProfile(this.lookup(resource, 'meta.profile'), 'mcode-cancer-related-medication-statement')
        ) {
          this.cancerRelatedMedicationStatement = this.lookup(resource, 'medicationCodeableConcept.coding') as string[];
        }

        if (
          resource.resourceType === 'Observation' &&
          this.resourceProfile(this.lookup(resource, 'meta.profile'), 'mcode-ecog-performance-status')
        ) {
          this.ecogPerformaceStatus = this.lookup(resource, 'valueInteger')[0] as number;
        }

        if (
          resource.resourceType === 'Observation' &&
          this.resourceProfile(this.lookup(resource, 'meta.profile'), 'mcode-karnofsky-performance-status')
        ) {
          this.karnofskyPerformanceStatus = this.lookup(resource, 'valueInteger')[0] as number;
        }
      }
    }
  }

  lookup(
    resource: fhirclient.FHIR.Resource,
    path: FHIRPath,
    environment?: { [key: string]: string }
  ): fhirpath.PathLookupResult[] {
    return fhirpath.evaluate(resource, path, environment);
  }

  resourceProfile(profiles: fhirpath.PathLookupResult[], key: string): boolean {
    for (const profile of profiles) {
      if ((profile as string).includes(key)) {
        return true;
      }
    }
    return false;
  }
}
