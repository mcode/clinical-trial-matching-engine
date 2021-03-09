import { Component, OnInit } from '@angular/core';

/**
 * Contains UI data on how to filter stuff out from a FHIR record.
 */
class FhirFilter {
  public id: string;
  public enabled: boolean;
  constructor(public name: string, public path: string) {
    // Generate an ID based on the name
    this.id = name.toLowerCase().replace(/\W+/g, '_');
  }
}

const DEFAULT_FILTERS: FhirFilter[] = [
  new FhirFilter('Stage', 'Condition.stage'),
  // Note: should only remove the specific extension element from the Condition
  new FhirFilter(
    'Cancer subtype',
    'Condition.extension.where(url = "http://hl7.org/fhir/us/mcode/StructureDefinition/mcode-histology-morphology-behavior")'
  ),
  new FhirFilter(
    'Biomarker',
    'Observation.meta.where(profile = "http://hl7.org/fhir/us/mcode/StructureDefinition/mcode-tumor-marker")'
  ),
  new FhirFilter(
    'ECOG score',
    'Observation.meta.where(profile = "http://hl7.org/fhir/us/mcode/StructureDefinition/mcode-ecog-performance-status")'
  ),
  new FhirFilter(
    'Karnofsky score',
    'Observation.meta.where(profile = "http://hl7.org/fhir/us/mcode/StructureDefinition/mcode-karnofsky-performance-status")'
  )
];

@Component({
  selector: 'app-filter-data',
  templateUrl: './filter-data.component.html',
  styleUrls: ['./filter-data.component.css']
})
export class FilterDataComponent {
  public filters: FhirFilter[];
  public filtersById: Record<string, FhirFilter> = {};

  constructor() {
    this.filters = DEFAULT_FILTERS;
    for (const filter of this.filters) {
      this.filtersById[filter.id] = filter;
    }
  }

  // ngOnInit(): void {}

  setFilter(id: string, enable: boolean) {
    const filter = this.filtersById[id];
    if (filter) {
      filter.enabled = enable;
    }
  }
}
