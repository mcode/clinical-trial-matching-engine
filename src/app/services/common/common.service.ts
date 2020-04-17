import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

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
  constructor(private http: HttpClient) { }
  /*
   * Variable for service URL
   */
  public configURL = '';
  /*
   * get drop down data
   */
  public getDropDownData(requestObj) {
    return this.http.post<GQSchemaResponse>(this.getServiceURL() + '/getClinicalTrial', requestObj);
  }
  /*
   * get drop down data
   */
  public searchClinialTrial(requestObj) {
    return this.http.post<ClinicalTrialResponse>(this.getServiceURL() + '/getClinicalTrial', requestObj);
  }
  /*
   * Get service URL
   */
  public getServiceURL() {
    this.configURL = config.SERVICE;
    return this.configURL;
  }
}

