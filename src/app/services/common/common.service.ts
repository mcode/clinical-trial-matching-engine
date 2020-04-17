import { Injectable } from '@angular/core';
import { Http, Response, RequestOptions, Headers } from '@angular/http';
 let config = require('../../configuration/configuration.json');
@Injectable({
  providedIn: 'root'
})
export class CommonService {
  constructor(
    private http: Http) { }
  /*
  Variable for service URL
*/
public config_URL: string = "";
 /*
 get drop down data
*/
public getDropDownData(requestObj){
  return this.http.post(this.getServiceURL() + '/getClinicalTrial', requestObj)
};
/*
 get drop down data
*/
public searchClinialTrial(requestObj){
  return this.http.post(this.getServiceURL() + '/getClinicalTrial', requestObj)
};
/*
 Get service URL
*/
public getServiceURL(){
  this.config_URL = config.SERVICE;
  return this.config_URL;
}
}

