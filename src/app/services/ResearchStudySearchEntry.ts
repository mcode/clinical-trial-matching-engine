import { DistanceService } from './distance.service';
import { SearchProvider } from './app-config.service';
import * as fhirpath from 'fhirpath';
import { GeolibInputCoordinates } from 'geolib/es/types';
import { BundleEntry, Group, ResearchStudy, Search } from '../fhir-types';
import { Location, Facility, FHIRPath } from './search.service';

/**
 * Helper function to create a unique ID.
 */
const createGlobalID = (function (): () => string {
  let id = 0;
  return function (): string {
    const newId = id++;
    return newId.toString();
  };
})();

/**
 * Wrapper class for a research study. Provides methods that handle parsing FHIR data (including dealing with optional
 * data) and calculating various parts of a ResearchStudy.
 */
export class ResearchStudySearchEntry {
  /**
   * The embedded resource.
   */
  resource: ResearchStudy;
  search?: Search;
  private cachedSites: fhirpath.FHIRResource[] | null = null;
  private containedResources: Map<string, fhirpath.FHIRResource> | null = null;
  dist: number | undefined;
  provider: SearchProvider;
  /**
   * An ID for this research study that is unique within its SearchResultsBundle.
   */
  readonly id: string;
  /**
   *
   * @param entry the bundle entry
   * @param index the index of the entry within the search results
   * @param distService the distance service
   * @param zipCode the ZIP code of the search, used to calculate distance
   * @param provider the provider that produced this result, currently this accepts a string for backwards compatibility
   *    (mostly to avoid having to rewrite a ton of tests)
   */
  constructor(
    public entry: BundleEntry,
    private distService: DistanceService,
    zipCode: string,
    provider: string | SearchProvider,
    id?: string
  ) {
    if (this.entry.resource.resourceType !== 'ResearchStudy')
      throw new Error(`Invalid resource type "${this.entry.resource.resourceType}"`);
    this.resource = this.entry.resource as ResearchStudy;
    this.search = this.entry.search;
    this.provider = typeof provider === 'string' ? new SearchProvider(provider, '') : provider;
    if (!id) {
      // See if there's an ID within the entry
      if (entry.resource?.id) {
        id = this.provider.id + '_' + entry.resource.id;
      }
    }
    this.id = id ?? createGlobalID();
    this.getClosest(zipCode);
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
      const groupIds = this.resource.enrollment.map((enrollment) => enrollment.reference.substr(1));
      const characteristics = [];
      for (const ref of this.resource.contained) {
        if (ref.resourceType == 'Group' && groupIds.includes(ref.id)) {
          const groupRef = ref as Group;
          if (groupRef.characteristic) {
            //characteristic is an array
            //how criteria is stored in characteristic currently unkown
            let exclusion = 'Exclusion: \n';
            let inclusion = 'Inclusion: \n';
            for (const trait of groupRef.characteristic) {
              if (trait.valueCodeableConcept) {
                if (trait.exclude) {
                  exclusion += `   ${trait.code.text} : ${trait.valueCodeableConcept.text}, \n`;
                } else {
                  inclusion += `   ${trait.code.text} : ${trait.valueCodeableConcept.text}, \n`;
                }
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
   * Returns the NCT ID for the trial, if it has one. If it does not have an NCT ID, returns undefined.
   */
  get nctId(): string | undefined {
    if (this.resource.identifier && this.resource.identifier.length > 0) {
      const identifier = this.resource.identifier.find(
        (id) => id.use === 'official' && id.system === 'http://clinicaltrials.gov'
      );
      if (identifier) {
        return identifier.value;
      }
    }
    return undefined;
  }

  get matchLikelihood(): string | null {
    let matchStr = null;
    if (this.search && this.search.score != null) {
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

  get trialURL(): string {
    return 'https://www.clinicaltrials.gov/ct2/show/' + this.nctId;
  }

  getClosest(zip: string): string {
    if (this.dist) {
      return `${this.dist} miles`;
    }
    const allsites: fhirpath.FHIRResource[] = this.getSites();
    if (!allsites || !zip || zip == '') return null;

    const points: GeolibInputCoordinates[] = [];
    for (const resource of allsites) {
      if (resource.resourceType === 'Location') {
        const loc = (resource as unknown) as Location;
        if (loc.position) {
          if (loc.position.latitude && loc.position.longitude) {
            const coordinate = {
              latitude: loc.position.latitude,
              longitude: loc.position.longitude
            } as GeolibInputCoordinates;
            points.push(coordinate);
          }
        }
      }
    }
    const origin = this.distService.getCoord(zip) as GeolibInputCoordinates;
    if (!origin || !points || points.length == 0) {
      return null;
    }
    const dist = this.distService.getDist(origin, points);
    this.dist = dist;
    return `${dist} miles`;
  }
  get distance(): number | undefined {
    return this.dist;
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
