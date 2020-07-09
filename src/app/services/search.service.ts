import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppConfigService } from './app-config.service';
import { fhirclient } from 'fhirclient/lib/types';
import * as fhirpath from 'fhirpath';

// Type alias for the patient bundle which presumably won't always be a string
type PatientBundle = string;

/**
 * Marks a path.
 */
export type FHIRPath = string;

export type ResearchStudy = fhirclient.FHIR.Resource;

/**
 * TrialScope facility. Will be removed eventually.
 */
export interface Facility {
  facility: string;
  contactPhone?: string;
  contactEmail?: string;
}

/**
 * Wrapper class for a research study. Provides hooks to deal with looking up
 * fields that may be missing in the actual FHIR result.
 */
export class ResearchStudySearchEntry {
  /**
   * The embedded resource.
   */
  resource: fhirclient.FHIR.Resource;
  private cachedSites: fhirpath.FHIRResource[] | null = null;
  constructor(public entry: fhirclient.FHIR.BundleEntry) {
    this.resource = this.entry.resource;
    console.log(this.entry);
  }

  // These map existing TrialScope properties to their new FHIR types. They
  // will likely be removed in the future.
  get overallStatus(): string {
    return this.lookupString('status');
  }
  get title(): string {
    return this.lookupString('title');
  }
  get conditions(): string {
    return JSON.stringify(this.lookup('condition.text'));
  }
  get studyType(): string {
    return this.resource.category && this.resource.category.length > 0 ? this.resource.category[0].text : '';
  }
  get description(): string {
    return this.detailedDescription;
  }
  get detailedDescription(): string {
    return this.lookupString('description');
  }
  get criteria(): string {
    if (this.resource.enrollment) {
      return this.resource.enrollment.map((enrollment) => enrollment.display).join(', ');
    } else {
      return '';
    }
  }
  get phase(): string {
    return this.lookupString('phase.text');
  }
  get sponsor(): string {
    // FIXME: Needs to pull a mapped field
    return 'sponsor';
  }
  get overallContact(): fhirclient.FHIR.RelatedPerson | null {
    return this.resource.contact && this.resource.contact.length > 0 ? this.resource.contact[0] : null;
  }
  get overallContactPhone(): string {
    // Use the first contact?
    const contact = this.overallContact;
    if (contact.telecom && contact.telecom.length > 0) {
      const result = contact.telecom.find((telecom) => telecom.system === 'phone');
      if (result) {
        return result.value;
      }
    }
    return '';
  }
  get overallContactEmail(): string {
    const contact = this.overallContact;
    if (contact.telecom && contact.telecom.length > 0) {
      const result = contact.telecom.find((telecom) => telecom.system === 'email');
      if (result) {
        return result.value;
      }
    }
    return '';
  }
  /**
   * @deprecated This will be REMOVED as the NCT ID is not the proper ID to
   * track for saved trials. Instead the URL of the ResearchStudy should be
   * used.
   */
  get nctId(): string {
    if (this.resource.identifier && this.resource.identifier.length > 0) {
      const identifier = this.resource.identifier.find((id) => id.use === 'official' && id.system === 'http://clinicaltrials.gov');
      if (identifier) {
        return identifier.value;
      }
    }
    return '';
  }
  get sites(): Facility[] {
    const sites = this.getSites();
    console.log(sites);
    return sites.map((site => {
      const result: Facility = { facility: typeof site.name === 'string' ? site.name : '(missing name)' };
      if (Array.isArray(site.telecom)) {
        for (const telecom of site.telecom) {
          if (telecom.system === 'phone') {
            result.contactPhone = telecom.value;
          } else if (telecom.system === 'email') {
            result.contactEmail = telecom.value;
          }
        }
      }
      return result;
    }));
  }

  /**
   * Lookup a value by FHIR path within the resource (NOT the bundle entry) for
   * this result.
   *
   * @param path the FHIR path
   */
  lookup(path: FHIRPath, environment?: { [key: string]: string }): fhirpath.PathLookupResult[] {
    return fhirpath.evaluate(this.resource, path, environment);
  }

  lookupString(path: FHIRPath, defaultValue: string | null = '(unknown)'): string {
    const values = this.lookup(path);
    if (values.length === 0) {
      return defaultValue;
    } else if (values.length === 1) {
      return values[0].toString();
    } else {
      return values.join(', ');
    }
  }

  /**
   * This helper function gets all the embedded sites directly by following
   * their references.
   */
  getSites(): fhirpath.FHIRResource[] {
    // Looking up each site can be expensive (especially if a future version has
    // to do network lookups or look inside the entire bundle) so cache them
    if (this.cachedSites !== null) {
      return this.cachedSites;
    }
    const sites = this.lookup('site');
    const result = sites.map((site) => {
      if (typeof site === 'object') {
        // This is more necessary to placate TypeScript than anything else
        const url = site.reference;
        if (typeof url === 'string' && url.length > 1 && url.substr(0, 1) === '#') {
          // For now, only handle local references
          const id = url.substr(1);
          return this.lookup('contained.where(id = %id)', { id: id });
        }
      }
      return null;
    });
    // And reduce to a single array
    return this.cachedSites = result.reduce<fhirpath.FHIRResource[]>((list, sites): fhirpath.FHIRResource[] => {
      if (Array.isArray(sites)) {
        // Make sure the results are all actual objects
        list.push(...(sites.filter((site) => {
          return typeof site === 'object';
        }) as fhirpath.FHIRResource[]));
      }
      return list;
    }, [] as fhirpath.FHIRResource[]);
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

  /**
   * Create a set of all current values at the given FHIR path. Values are
   * assumed to be string values.
   * @param path the FHIR path
   */
  buildFilters(path: string): Set<string> {
    const results = new Set<string>();
    for (const researchStudy of this.researchStudies) {
      const value = researchStudy.lookupString(path);
      if (value !== null && value !== undefined)
        results.add(value);
    }
    return results;
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
