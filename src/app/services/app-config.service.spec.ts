import { TestBed } from '@angular/core/testing';

import { AppConfigService, SearchProviders } from './app-config.service';

describe('AppConfigService', () => {
  it('uses the injected SearchProviders if they exist', () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: SearchProviders,
          useValue: new SearchProviders([{ name: 'TestService', url: 'https://www.example.com/test-service' }])
        }
      ]
    });
    const service: AppConfigService = TestBed.inject(AppConfigService);
    const providers = service.getSearchProviders();
    expect(providers.length).toEqual(1);
    expect(providers[0].name).toEqual('TestService');
    expect(providers[0].url).toEqual('https://www.example.com/test-service');
  });

  it('gets configured services from the environment if none are provided', () => {
    TestBed.configureTestingModule({});
    const service: AppConfigService = TestBed.inject(AppConfigService);
    expect(Array.isArray(service.getSearchProviders())).toBeTrue();
  });
});
