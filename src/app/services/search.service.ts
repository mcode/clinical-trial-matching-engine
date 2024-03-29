import { DistanceService } from './distance.service';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppConfigService, SearchProvider } from './app-config.service';
import { PatientBundle } from '../bundle';
import { Bundle } from '../fhir-types';
import { ResearchStudySearchEntry } from './ResearchStudySearchEntry';
import * as fhirpath from 'fhirpath';

/**
 * Marks a path.
 */
export type FHIRPath = string;

/**
 * Very basic facility mapping. Will be removed in favor of direct access to
 * the FHIR Location objects via getSites().
 */
export interface Facility {
  facility: string;
  contactPhone?: string;
  contactEmail?: string;
}
interface BaseResource {
  resourceType: string;
  id?: string;
}
export interface Location extends BaseResource {
  resourceType: 'Location';
  name?: string;
  telecom?: unknown;
  position?: { longitude?: number; latitude?: number };
  address?: Address;
}

export interface Address {
  country?: string;
  postalCode?: string;
}

/**
 * The search results bundle. There's a decent chance that this will be
 * encapsulated in some way to provide methods to deal with moving towards next
 * pages in the future.
 */
export class SearchResultsBundle {
  researchStudies: ResearchStudySearchEntry[];

  /**
   * Create a new results bundle.
   * @param bundle the original bundle
   * @param distService distance service for calculating distance to a given trial
   * @param zip the ZIP code of the original search
   * @param source the service providing the service
   */
  constructor(bundle: Bundle, distService: DistanceService, zip: string, source: SearchProvider);
  /**
   * Copies the given bundles into a new merged bundle that covers the results.
   * @param others the bundles to copy
   */
  constructor(others: SearchResultsBundle[]);
  constructor(
    bundleOrCollection: Bundle | SearchResultsBundle[],
    distService?: DistanceService,
    zip?: string,
    source?: SearchProvider
  ) {
    if (Array.isArray(bundleOrCollection)) {
      // Merge mode
      this.researchStudies = [];
      for (const results of bundleOrCollection) {
        this.researchStudies.push(...results.researchStudies);
      }
    } else if (bundleOrCollection.entry) {
      this.researchStudies = bundleOrCollection.entry
        .filter((entry) => {
          return entry.resource.resourceType === 'ResearchStudy';
        })
        .map((entry) => new ResearchStudySearchEntry(entry, distService, zip, source));
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
   * @param path Required; The FHIR path
   * @param isArray Optional; True/False on whether the results of path is array
   * @param secondary_path Required if isArray=True; FHIR path of resulting resources in isArray
   * @param prefix Optional; If the given value needs to start with a given text
   */
  buildFilters(path: string, isArray?: boolean, secondary_path?: string, prefix?: string): Set<string> {
    const results = new Set<string>();

    for (const researchStudy of this.researchStudies) {
      if (isArray) {
        const arr: fhirpath.FHIRResource[] = researchStudy.lookup(path) as fhirpath.FHIRResource[];

        for (const item of arr) {
          if (secondary_path) {
            const value = fhirpath.evaluate(item, secondary_path);
            if (prefix && value !== null && value !== undefined) {
              if (value.toString().startsWith(prefix)) results.add(value.toString());
            } else if (value !== null && value !== undefined) results.add(value.toString());
          }
        }
      } else {
        const value = researchStudy.lookupString(path);
        if (prefix && value !== null && value !== undefined) {
          if (value.toString().startsWith(prefix)) results.add(value.toString());
        } else if (value !== null && value !== undefined) results.add(value.toString());
      }
    }
    return results;
  }
}

/**
 * Service for running the search.
 */
@Injectable({
  providedIn: 'root'
})
export class SearchService {
  constructor(private client: HttpClient, private config: AppConfigService, protected distService: DistanceService) {}

  /**
   * Searches for clinical trials across all configured services.
   * @param patientBundle the patient data that provides parameters for the search
   * @returns an Observable that returns matching bundles
   */
  searchClinicalTrials(patientBundle: PatientBundle): Observable<SearchResultsBundle> {
    const services: SearchProvider[] = this.config.getSearchProviders();
    const zipCode = patientBundle.entry[0].resource.parameter[0].valueString;

    const observables = services.map((service) => {
      return this.client.post<Bundle>(service.url + '/getClinicalTrial', patientBundle).pipe(
        map((bundle: Bundle) => {
          return new SearchResultsBundle(bundle, this.distService, zipCode, service);
        })
      );
    });
    return forkJoin(observables).pipe(map((bundles) => new SearchResultsBundle(bundles)));
  }
}
