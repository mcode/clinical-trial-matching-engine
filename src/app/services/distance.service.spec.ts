import { TestBed } from '@angular/core/testing';

import { DistanceService } from './distance.service';

describe('DistanceService', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [DistanceService] }));

  it('should be created', () => {
    const service: DistanceService = TestBed.get(DistanceService);
    expect(service).toBeTruthy();
  });
});
