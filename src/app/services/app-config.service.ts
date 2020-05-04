import { Injectable } from '@angular/core';

import { environment } from '../../environments/environment';

/**
 * Provides a method for accessing global app configuration. Currently pulls
 * from the environment, but is accessed as a service to enable it to be
 * transitioned over to some other method in the future.
 */
@Injectable({
  providedIn: 'root'
})
export class AppConfigService {
  /**
   * Get the service endpoint URL. If not set, assumes the current URL should be
   * used.
   */
  getServiceURL(): string {
    if ('serviceURL' in environment)
      return environment.serviceURL;
    return window.location.toString();
  }
}
