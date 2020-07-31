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
 * Very basic facility mapping. Will be removed in favor of direct access to
 * the FHIR Location objects via getSites().
 */
export interface Facility {
  facility: string;
  contactPhone?: string;
  contactEmail?: string;
}

interface Search {
  mode: string;
  score: number;
}

interface BundleEntry extends fhirclient.FHIR.BundleEntry {
  search?: Search;
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
  search?: Search;
  private cachedSites: fhirpath.FHIRResource[] | null = null;
  private containedResources: Map<string, fhirpath.FHIRResource> | null = null;

  constructor(public entry: BundleEntry) {
    this.resource = this.entry.resource;
    this.search = this.entry.search;
    console.log(this.entry);
  }

  // These provide "simple" access to various FHIR fields. They are generally
  // deprecated in favor of using lookupString to get the field directly.
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
      const groupIds = this.resource.enrollment.map((enrollment) => (enrollment.reference as string).substr(1));
      const characteristics = [];
      for (const ref of this.resource.contained) {
        if (ref.resourceType == 'Group' && ref.id in groupIds) {
          if (ref.characteristic) {
            //characteristic is an array

            //how criteria is stored in characteristic currently unkown
            let exclusion = 'Exclusion \n';
            let inclusion = 'Inclusion \n';
            for (const trait of ref.characteristic) {
              if (trait.exclude) {
                exclusion += `${trait.code.text} : ${trait.valueCodeableConcept.text}, \n`;
              } else {
                inclusion += `${trait.code.text} : ${trait.valueCodeableConcept.text}, \n`;
              }
            }
            const traits = `${inclusion} \n ${exclusion}`;
            characteristics.push(traits);
          }
        }
      }
      if (characteristics.length !== 0) {
        return characteristics.join(',\n');
      } else {
        return this.resource.enrollment.map((enrollment) => enrollment.display).join(', ');
      }
    } else {
      return '';
    }
  }
  get phase(): string {
    return this.lookupString('phase.text');
  }
  get sponsor(): string {
    const sponsors = this.lookup('sponsor');
    if (sponsors.length < 1) {
      return '(None)';
    }
    // Use the first sponsor reference
    const ref = sponsors.find((s) => typeof s === 'object' && 'reference' in s) as fhirpath.FHIRResource | undefined;
    if (ref && typeof ref.reference === 'string') {
      const sponsor = this.lookupResource(ref.reference);
      if (sponsor) {
        if (typeof sponsor.name === 'string') {
          return sponsor.name;
        } else {
          return '(Invalid sponsor object)';
        }
      }
    }
    // This covers both the reference being bad and the sponsor missing
    return '(Not found)';
  }
  get overallContact(): string | null {
    return this.lookupString('contact.name', null);
  }
  get overallContactPhone(): string {
    return this.lookupString("contact.telecom.where(system = 'phone').value", '');
  }
  get overallContactEmail(): string {
    return this.lookupString("contact.telecom.where(system = 'email').value", '');
  }
  /**
   * @deprecated This will be REMOVED as the NCT ID is not the proper ID to
   * track for saved trials. Instead the URL of the ResearchStudy should be
   * used.
   */
  get nctId(): string {
    if (this.resource.identifier && this.resource.identifier.length > 0) {
      const identifier = this.resource.identifier.find(
        (id) => id.use === 'official' && id.system === 'http://clinicaltrials.gov'
      );
      if (identifier) {
        return identifier.value;
      }
    }
    return '';
  }
  get matchLikelihood(): string | null {
    let matchStr = null;
    if (this.search) {
      if (this.search.score < 0.33) {
        matchStr = 'No Match';
      } else if (this.search.score < 0.67) {
        matchStr = 'Possible Match';
      } else {
        matchStr = 'Likely Match';
      }
    }
    return matchStr;
  }
  /**
   * @deprecated. Use #getSites to get the sites. The use a method also makes it
   * clearer that this is not a simple property but involves a fair amount of
   * computing to generate. In the future, getSites may become async anyway.
   */
  get sites(): Facility[] {
    const sites = this.getSites();
    return sites.map((site) => {
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
    });
  }

  /**
   * Lookup a value by FHIR path within the resource (NOT the bundle entry) for
   * this search result.
   *
   * @param path the FHIR path
   * @param environment the FHIR path environment (for embedding values into the path)
   * @returns an array of found values (empty if nothing found)
   */
  lookup(path: FHIRPath, environment?: { [key: string]: string }): fhirpath.PathLookupResult[] {
    return fhirpath.evaluate(this.resource, path, environment);
  }

  /**
   * Looks up a value by FHIR path within the resource (NOT the bundle entry)
   * for this search result.
   *
   * @param path the FHIR path
   * @param defaultValue
   *     the default value if not found, defaults to the string '(unknown)'
   * @returns
   *     either the found value or the given default value. If multiple values
   *     are found, this simply joins them with a comma.
   */
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
   * Looks up a contained resource within the resource for the search result.
   * @param id the ID of the resource
   * @returns
   *    the resource of that ID or undefined if no resource exists with that ID
   */
  lookupContainedResource(id: string): fhirpath.FHIRResource | undefined {
    if (this.containedResources === null) {
      // If we haven't built our ID map, do it now
      this.containedResources = new Map<string, fhirpath.FHIRResource>();
      this.lookup('contained').forEach((resource): void => {
        if (typeof resource === 'object') {
          if (typeof resource.id === 'string') {
            this.containedResources.set(resource.id, resource);
          }
        }
      });
    }
    return this.containedResources.get(id);
  }

  /**
   * Looks up a resource based on the URL.
   * Note: At present, this ONLY works with contained resources referenced by
   * relative URLs such as "#contained-id".
   * Note: this will likely eventually be made to be async.
   * @param url the URL to pull the resource from
   */
  lookupResource(url: string): fhirpath.FHIRResource | undefined {
    if (url.length > 0 && url.startsWith('#')) {
      return this.lookupContainedResource(url.substr(1));
    } else {
      return undefined;
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
    const result: Array<fhirpath.FHIRResource | undefined> = sites.map((site): fhirpath.FHIRResource | undefined => {
      if (typeof site === 'object') {
        // This is more necessary to placate TypeScript than anything else
        const url = site.reference;
        if (typeof url === 'string' && url.length > 1 && url.substr(0, 1) === '#') {
          // For now, only handle local references
          const id = url.substr(1);
          return this.lookupContainedResource(id);
        }
      }
      return undefined;
    });
    // And filter out any missing embedded sites
    return (this.cachedSites = result.filter((site) => typeof site === 'object'));
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
      this.researchStudies = bundle.entry
        .filter((entry) => {
          return entry.resource.resourceType === 'ResearchStudy';
        })
        .map((entry) => new ResearchStudySearchEntry(entry));
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
      if (value !== null && value !== undefined) results.add(value);
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
  constructor(private client: HttpClient, private config: AppConfigService) {}

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
