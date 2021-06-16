import { Injectable, Optional } from '@angular/core';

import { environment } from '../../environments/environment';

export interface SearchProviderJSON {
  name: string;
  url: string;
}

/**
 * Class that represents a source.
 */
export class SearchProvider {
  id: string;
  constructor(public name: string, public url: string) {
    this.id = name.replace(/\W+/g, '_');
  }
}

/**
 * Provides a method for accessing global app configuration. Currently pulls
 * from the environment, but is accessed as a service to enable it to be
 * transitioned over to some other method in the future.
 */
@Injectable({
  providedIn: 'root'
})
export class AppConfigService {
  private _servers: SearchProviderJSON[];
  constructor(@Optional() servers?: SearchProviderJSON[]) {
    // If given servers, use that
    this._servers = servers ? servers : environment.servers;
  }
  /**
   * Gets configured search providers.
   * @returns an array of configured search providers
   */
  getSearchProviders(): SearchProvider[] {
    return this._servers.map((def) => {
      return new SearchProvider(def.name, def.url);
    });
  }
}
