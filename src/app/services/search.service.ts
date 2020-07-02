import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppConfigService } from './app-config.service';
import { fhirclient } from 'fhirclient/lib/types';

// Type alias for the patient bundle which presumably won't always be a string
type PatientBundle = string;

export type ResearchStudy = fhirclient.FHIR.Resource;

/**
 * Wrapper class for a research study. Provides hooks to deal with looking up
 * fields that may be missing in the actual FHIR result.
 */
export class ResearchStudySearchEntry {
  /**
   * The embedded resource.
   */
  resource: fhirclient.FHIR.Resource;
  constructor(public entry: fhirclient.FHIR.BundleEntry) {
    this.resource = this.entry.resource;
    console.log(this.entry);
  }

  // These map existing TrialScope properties to their new FHIR types. They
  // will likely be removed in the future.
  get overallStatus(): string {
    return this.resource.status;
  }
  get title(): string {
    return this.resource.title ? this.resource.title : '(unknown)';
  }
  get conditions(): string {
    return this.resource.condition ? this.resource.condition.map((condition) => condition.text).join(', ') : '';
  }
}

/**
 * The search results bundle. There's a decent chance that this will be
 * encapsulated in some way to provide methods to deal with moving towards next
 * pages in the future.
 */
export class SearchResultsBundle {
  researchStudies: ResearchStudySearchEntry[];

  constructor(public bundle: fhirclient.FHIR.Bundle) {
    if (bundle.entry) {
      console.log(`Filtering ${bundle.entry.length} results, looking for studies...`);
      this.researchStudies = bundle.entry.filter((entry) => {
        return entry.resource.resourceType === 'ResearchStudy'
      }).map((entry) => new ResearchStudySearchEntry(entry));
    } else {
      this.researchStudies = [];
    }
  }

  get totalCount(): number {
    return this.researchStudies.length;
  }

  buildFilters(property: string): Set<string> {
    // FIXME: Implement
    return new Set<string>();
  }
}

interface ClinicalTrialQuery {
  patientData: PatientBundle;
  count: number;
  offset?: number;
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  constructor(private client: HttpClient, private config: AppConfigService) { }

  searchClinicalTrials(patientBundle: PatientBundle, offset?: number, count = 10): Observable<SearchResultsBundle> {
    const query: ClinicalTrialQuery = { patientData: patientBundle, count: count };
    if (offset > 0) {
      query.offset = offset;
    }
    return this.client.post<fhirclient.FHIR.Bundle>(this.config.getServiceURL() + '/getClinicalTrial', query).pipe(
      map((bundle: fhirclient.FHIR.Bundle) => {
        return new SearchResultsBundle(bundle);
      })
    );
  }
}
