import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppConfigService } from './app-config.service';

import { Trial } from '../trialscope';

type JsonObject = {[key: string]: any};
type TrialScopeResponse = JsonObject;

/**
 * This represents a single page returned from TrialScope.
 */
export class TrialScopePage {
  trials: Partial<Trial>[];
  nextPageCursor: string;
  hasNextPage: boolean;
  constructor(json: JsonObject) {
    // The given JSON object should be a TrialScope data object
    this.trials = json.edges.map(edge => edge.node);
    this.nextPageCursor = json.pageInfo.endCursor;
    this.hasNextPage = json.pageInfo.hasNextPage;
  }
}

/**
 * This represents an overall response from TrialScope. It handles pagination.
 */
export class TrialScopeResult {
  pages: TrialScopePage[] = [];
  totalCount: number;
  itemsPerPage = 10;
  constructor(json: JsonObject) {
    // Pull out the total count
    console.log('Creating result:');
    console.log(json);
    this.totalCount = json.data.baseMatches.totalCount;
    this.pages = [ new TrialScopePage(json.data.baseMatches) ];
    console.log('Pages:');
    console.log(this.pages);
  }
  /**
   * Gets a given page.
   * @param page the page number
   */
  getPage(page: number): TrialScopePage {
    // TODO: Ensure the page number is valid
    // TODO: Do not fetch all pages at once
    return this.pages[page];
  }
  /**
   * Builds lists of unique elements.
   */
  buildFilters() {/*
  this.clinicalTraildata.data.baseMatches.edges = _.uniqBy(this.clinicalTraildata.data.baseMatches.edges, 'node.nctId');
  this.clinicalTraildataCopy = [...this.clinicalTraildata.data.baseMatches.edges];
  const newArray = [];
  const myArray = _.uniqBy(this.clinicalTraildata.data.baseMatches.edges, 'node.conditions');
  for (const condition of myArray) {
    const tempArray = JSON.parse(condition.node.conditions);
    for (const e of tempArray) {
      newArray.push({ key: e });
    }
  }
  this.filtersArray = [
    {
      val: 'My Conditions',
      selectedVal: 'conditions',
      data: _.uniq(_.map(newArray, 'key'))
    },
    {
      val: 'Recruitment',
      selectedVal: 'overallStatus',
      data: _.uniq(_.map(this.clinicalTraildata.data.baseMatches.edges, 'node.overallStatus'))
    },
    {
      val: 'Phase',
      selectedVal: 'phase',
      data: _.uniq(_.map(this.clinicalTraildata.data.baseMatches.edges, 'node.phase'))
    },
    {
      val: 'Study Type',
      selectedVal: 'studyType',
      data: _.uniq(_.map(this.clinicalTraildata.data.baseMatches.edges, 'node.studyType'))
    }
  ];
  for (const filter of this.filtersArray.length) {
    for (let y = 0; y < filter.data.length; y++) {
      filter.data[y] = {
        val: filter.data[y],
        selectedItems: false,
      };
    }
  }
  this.searchtable = false;
  this.searchPage = true;
  this.countPages(this.clinicalTraildata);
}*/
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
    } }`).pipe(
      map(response => new TrialScopeResult(response))
    );
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
