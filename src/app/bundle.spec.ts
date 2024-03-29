import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { createPatientBundle } from './bundle';

describe('bundle tests', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [HttpClientTestingModule], providers: [] }));

  it('should create the patient bundle', () => {
    expect(
      createPatientBundle({ zipCode: '01780', travelRadius: 20 }, [
        { fullUrl: 'sample', resource: { resourceType: 'Resource' } }
      ])
    ).toBeDefined();
  });
});
