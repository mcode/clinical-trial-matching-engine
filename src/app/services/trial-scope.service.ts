import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppConfigService } from './app-config.service';

import { Trial } from '../trialscope';

type JsonObject = {[key: string]: unknown };
interface TrialScopeResponse {
  data: JsonObject;
}

interface PageInfo {
  endCursor: string;
  hasNextPage: boolean;
  hasPreviousPage?: boolean;
  startCursor: string;
}

/**
 * This represents a single page returned from TrialScope.
 */
export class TrialScopePage {
  trials: Partial<Trial>[];
  nextPageCursor: string;
  hasNextPage: boolean;
  /**
   * Index of the last result (exclusive)
   */
  endIndex: number;
  constructor(json: JsonObject | null, public startIndex: number) {
    // The given JSON object should be a TrialScope data object
    if (!Array.isArray(json.edges))
      throw new Error('Missing edges array in results');
    this.trials = json.edges.map(edge => edge.node as Partial<Trial>);
    const pageInfo = json.pageInfo as PageInfo;
    this.nextPageCursor = pageInfo.endCursor;
    this.hasNextPage = pageInfo.hasNextPage;
    this.endIndex = startIndex + this.trials.length;
  }
}

/**
 * This represents an overall response from TrialScope. It handles pagination.
 */
export class TrialScopeResult {
  pages: TrialScopePage[] = [];
  totalCount: number;
  itemsPerPage: number;
  constructor(private source: TrialScopeService, private sourceQuery: string, totalCount: number, pages: TrialScopePage[]) {
    // Pull out the total count
    this.totalCount = totalCount;
    this.pages = pages;
    // Pull the items per page out of the first page based on the assumption
    // that the method used to pull the trials array may change in the future.
    // TODO: Verify that the items per page will not change on a per-page
    // basis.
    this.itemsPerPage = this.pages[0].trials.length;
  }
  /**
   * Gets a given page. (In the future, this may return an observable.)
   * @param page the page number
   */
  getPage(page: number): TrialScopePage {
    // TODO: Ensure the page number is valid
    // TODO: Do not fetch all pages at once
    return this.pages[page];
  }
  /**
   * Gets a slice of trials from the paged results. (In the future, this may
   * return an observable.) If the end index is past the end of the results,
   * the result will be smaller than endIndex - startIndex.
   * @param startIndex the index of the first trial to get (inclusive)
   * @param endIndex the index of the last trial to get (exclusive)
   */
  getTrials(startIndex: number, endIndex: number): Partial<Trial>[] {
    // TODO: Can we be sure that the pages are always the same size?
    if (endIndex > this.totalCount) {
      endIndex = this.totalCount;
    }
    const startPage = this.pageIndexForTrialIndex(startIndex);
    const endPage = this.pageIndexForTrialIndex(endIndex - 1);
    console.log(`Getting results for trials ${startIndex}-${endIndex} from pages ${startPage}-${endPage} (${this.itemsPerPage} per page)`)
    if (startPage === endPage) {
      // Self-contained
      const page = this.pages[startPage];
      return page.trials.slice(startIndex - page.startIndex, endIndex - page.startIndex);
    } else {
      // Spans pages
      let page = this.pages[startPage];
      const results: Partial<Trial>[] = page.trials.slice(startIndex - page.startIndex);
      for (let index = startPage + 1; index < endPage; index++) {
        // Just add the entire page
        results.push(...this.pages[index].trials);
      }
      // And finally add the remaining portion of the last page
      page = this.pages[endPage];
      results.push(...page.trials.slice(0, endIndex - page.startIndex));
      return results;
    }
  }
  /**
   * Convert a trial index into the page index containing that trial.
   * @param index the index of the trial
   */
  pageIndexForTrialIndex(index: number): number {
    // Currently this assumes pages (except the last) will always be the same
    // size. This has not been verified. A future version may perform a binary
    // search.
    return Math.floor(index / this.itemsPerPage);
  }
  /**
   * Builds lists of unique elements. This will skip pages that have not been
   * loaded yet.
   */
  buildFilters<T>(property: string): Set<T> {
    const results = new Set<T>();
    for (const page of this.pages) {
      page.trials.forEach(trial => results.add(trial[property]));
    }
    return results;
  }
}

interface GQEnumValue {
  name: string;
}
interface GQEnumType {
  enumValues: [GQEnumValue];
}
interface GQTypeResponse {
  __type: GQEnumType;
}
interface GQSchemaResponse {
  data: GQTypeResponse;
}

@Injectable({
  providedIn: 'root'
})
export class TrialScopeService {
  constructor(private client: HttpClient, private config: AppConfigService) { }

  /**
   * Gets a list of drop down values allowed for a given type.
   */
  public getDropDownData(type: string): Observable<string[]> {
    // TODO: ensure the type string is valid?
    const query = `{ __type(name: "${type}") { enumValues { name } } }`;
    return this.client.post<GQSchemaResponse>(
      this.config.getServiceURL() + '/getClinicalTrial', { inputParam: query }
    ).pipe(
      map(response => {
        return response.data.__type.enumValues.map(value => value.name);
      })
    );
  }

  /**
   * Executes a "baseMatches" query - this expects the given query to contain
   * **only** the contents for the baseMatches element and **NOT** the entire
   * GraphQL query. A complete GraphQL query will be constructed.
   * @param query the query to run
   * @param first the number of trials to request in this page
   * @param after if given, where to start in the query
   */
  public baseMatches(query: string, first = 30, after: string | null = null): Observable<TrialScopeResult> {
    return new Observable(subscriber => {
      // This functions by loading all the pages at present
      const pages = [];
      let startIndex = 0;
      const loadPage: (TrialScopeResult) => void = response => {
        // Once we have the first response, we want to keep loading
        const page = new TrialScopePage(response.data.baseMatches as JsonObject, startIndex);
        pages.push(page);
        startIndex += page.trials.length;
        if (page.hasNextPage) {
          this.loadBaseMatchesPage(query, first, page.nextPageCursor).subscribe(loadPage);
        } else {
          subscriber.next(new TrialScopeResult(this, query, response.data.baseMatches.totalCount, pages));
          subscriber.complete();
        }
      };
      this.loadBaseMatchesPage(query, first, after).subscribe(loadPage);
    });
  }

  loadBaseMatchesPage(query: string, first = 30, after: string | null = null): Observable<TrialScopeResponse> {
    return this.search(`
    {
      baseMatches(first: ${first} after: ${JSON.stringify(after)} ${query})
    {
      totalCount
      edges {
        node {
          nctId title conditions gender description detailedDescription
          criteria sponsor overallContactPhone overallContactEmail
          overallStatus armGroups phase minimumAge studyType
          maximumAge sites {
            facility contactName contactEmail contactPhone latitude longitude
          }
        }
        cursor
      }
      pageInfo { endCursor hasNextPage }
    } }`);
  }

  /**
   * Execute a TrialScope query directly. Generally this method should not be
   * used, either baseMatches or advancedMatches should be used.
   * @param query the GraphQL query to use
   */
  public search(query): Observable<TrialScopeResponse> {
    console.log('Executing query:');
    console.log(query);
    return this.client.post<TrialScopeResponse>(
      this.config.getServiceURL() + '/getClinicalTrial', { inputParam: query }
    );
  }
}
