import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// FIXME: Not sure what best practices are for loading configuration within Angular
// eslint-disable-next-line @typescript-eslint/no-var-requires
const config = require('../../configuration/configuration.json');

export interface GQEnumValue {
  name: string;
}
export interface GQEnumType {
  enumValues: [GQEnumValue];
}
export interface GQTypeResponse {
  __type: GQEnumType;
}
export interface GQSchemaResponse {
  data: GQTypeResponse;
}

export interface ClinicalTrialResponse {
  data: any;
}

@Injectable({
  providedIn: 'root'
})
export class CommonService {
  /*
   * Variable for service URL
   */
  public configURL = '';
  constructor(private http: HttpClient) { }
  /*
   * get drop down data
   */
  public getDropDownData(requestObj): Observable<GQSchemaResponse> {
    return this.http.post<GQSchemaResponse>(this.getServiceURL() + '/getClinicalTrial', requestObj);
  }
  /*
   * get drop down data
   */
  public searchClinialTrial(requestObj): Observable<ClinicalTrialResponse> {
    return this.http.post<ClinicalTrialResponse>(this.getServiceURL() + '/getClinicalTrial', requestObj);
  }
  /*
   * Get service URL
   */
  public getServiceURL(): string {
    this.configURL = config.SERVICE;
    return this.configURL;
  }
}

