import { TestBed } from '@angular/core/testing';

import { AppConfigService } from './app-config.service';

describe('AppConfigService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: AppConfigService = TestBed.inject(AppConfigService);
    expect(service).toBeDefined();
  });
  it('should get configured services', () => {
    const service: AppConfigService = TestBed.inject(AppConfigService);
    expect(Array.isArray(service.getSearchProviders())).toBeTrue();
  });
});
