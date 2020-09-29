import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { DistanceService } from './distance.service';

describe('DistanceService', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule], providers: [DistanceService] })
  );

  it('should be created', () => {
    const service: DistanceService = TestBed.get(DistanceService);
    expect(service).toBeTruthy();
  });
});
