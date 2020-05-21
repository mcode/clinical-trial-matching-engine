import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppConfigService } from './app-config.service';

export interface TrialScopeResponse {
  data: any;
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
    return this.client.post<GQSchemaResponse>(this.config.getServiceURL() + '/getClinicalTrial', { inputParam: query }).pipe(
      map(response => {
        return response.data.__type.enumValues.map(value => value.name);
      })
    );
  }

  public search(query): Observable<TrialScopeResponse> {
    return this.client.post<TrialScopeResponse>(this.config.getServiceURL() + '/getClinicalTrial', { inputParam: query });
  }
}
