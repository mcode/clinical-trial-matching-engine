import { GeolibInputCoordinates } from 'geolib/es/types';
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

  it('should get a point for a zip code', () => {
    const service: DistanceService = TestBed.get(DistanceService);
    // Test with leading 0
    let point = service.getCoord('01730');
    expect(point.latitude).toBeCloseTo(42.49697, 5);
    expect(point.longitude).toBeCloseTo(-71.27834, 5);
    // Test with all numbers
    point = service.getCoord('22102');
    expect(point.latitude).toBeCloseTo(38.94813, 5);
    expect(point.longitude).toBeCloseTo(-77.22787, 5);
  });
  it('should calculate the distance', () => {
    const service: DistanceService = TestBed.get(DistanceService);

    const origin = service.getCoord('01730') as GeolibInputCoordinates;

    const dest = service.getCoord('22102') as GeolibInputCoordinates;

    const dist = service.getDist(origin, [dest]);
    expect(dist).toBeCloseTo(396.71, 5);
  });
});
