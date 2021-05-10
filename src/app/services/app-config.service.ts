import { Injectable } from '@angular/core';

import { environment } from '../../environments/environment';
import { SearchProvider } from './search.service';

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
   * Gets configured search providers.
   * @returns an array of configured search providers
   */
  getSearchProviders(): SearchProvider[] {
    return environment.servers.map((def) => {
      return new SearchProvider(def.name, def.url);
    });
  }
}
