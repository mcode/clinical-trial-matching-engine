import { Component } from '@angular/core';
import { PatientBundle } from '../bundle';
import { FhirFilter, deepClone } from '../fhir-filter';
import { FILTERS } from './default-filters';

/**
 * Contains UI data on how to filter stuff out from a FHIR record.
 */
class DataFilter {
  public id: string;
  public enabled: boolean;
  constructor(public name: string, public filter: FhirFilter) {
    // Generate an ID based on the name
    this.id = name.toLowerCase().replace(/\W+/g, '_');
  }
}

const DEFAULT_FILTERS: DataFilter[] = Object.entries(FILTERS).map(([name, filter]) => {
  return new DataFilter(name, filter);
});

@Component({
  selector: 'app-filter-data',
  templateUrl: './filter-data.component.html',
  styleUrls: ['./filter-data.component.css']
})
export class FilterDataComponent {
  public filters: DataFilter[];
  public filtersById: Record<string, DataFilter> = {};

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

  isFilterEnabled(): boolean {
    for (const filter of this.filters) {
      if (filter.enabled) return true;
    }
    return false;
  }

  /**
   * Gets an array of active FHIR filters
   * @returns the active FHIR filters
   */
  getFilters(): FhirFilter[] {
    const result: FhirFilter[] = [];
    for (const filter of this.filters) {
      if (filter.enabled) result.push(filter.filter);
    }
    return result;
  }

  /**
   * Filters the given bundle, removing any elements from it that should be
   * removed.
   * @param bundle the bundle to filter
   */
  filterBundle(bundle: PatientBundle): void {
    const filters = this.getFilters();
    for (const f of filters) {
      f.filterBundle(bundle);
    }
  }

  /**
   * Creates a copy of the bundle with requested items filtered out.
   * @param bundle the bundle to copy and then filter
   * @returns the copied bundle
   */
  filterBundleCopy(bundle: PatientBundle): PatientBundle {
    const copy = deepClone(bundle);
    this.filterBundle(copy);
    return copy;
  }
}
