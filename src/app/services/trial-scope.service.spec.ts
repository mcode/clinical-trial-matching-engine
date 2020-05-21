import { TestBed } from '@angular/core/testing';

import { TrialScopeService } from './trial-scope.service';

describe('TrialScopeService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: TrialScopeService = TestBed.get(TrialScopeService);
    expect(service).toBeTruthy();
  });
});
