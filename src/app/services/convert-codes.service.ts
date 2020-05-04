import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';

/**
 * Service for converting SNOMED/other codes.
 */
@Injectable({
  providedIn: 'root'
})
export class ConvertCodesService {
  constructor(private client: HttpClient, private config: AppConfigService) { }
  /**
   * Converts codes to SNOMED codes.
   * @param codes codes to convert
   */
  public convertCodes(codes: string[]): Observable<string[]> {
    return this.client.post<string[]>(this.config.getServiceURL() + '/getConditions', codes, { responseType: 'json' });
  }
}
