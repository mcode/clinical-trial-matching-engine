import { Inject, Injectable, Optional } from '@angular/core';

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
 * This class exists solely to allow servers to be injected to the app config.
 * To use it, you need to provide your own provider, as it is not injected
 * anywhere by default.
 *
 * For example:
 * {
 *   provide: SearchProviders,
 *   useValue: new SearchProviders([{ name: 'TestService', url: 'https://www.example.com' }])
 * }
 */
@Injectable()
export class SearchProviders {
  constructor(public servers: SearchProviderJSON[]) {}
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
  // Because we specify the constructor as allowing the interface (basically, so you can use it with a simple JSON
  // object), we need to tell Angular what to use for dependency injection.
  constructor(@Inject(SearchProviders) @Optional() servers?: SearchProviders | SearchProviderJSON[] | null) {
    // If given servers, use that
    if (servers instanceof SearchProviders) {
      this._servers = servers.servers;
    } else {
      this._servers = servers ? servers : environment.servers;
    }
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
