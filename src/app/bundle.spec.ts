import { TestBed, async } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { PatientBundle, createPatientBundle } from './bundle';

describe('bundle tests', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [HttpClientTestingModule], providers: [] }));

  it('should create the patient bundle', () => {
    expect(createPatientBundle({ id: 'example' }, [{ fullUrl: 'sample', resource: {} }])).toBeDefined();
  });
});
