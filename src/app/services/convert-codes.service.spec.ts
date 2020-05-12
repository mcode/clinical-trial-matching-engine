import { TestBed } from '@angular/core/testing';

import { ConvertCodesService } from './convert-codes.service';

describe('ConvertCodesService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ConvertCodesService = TestBed.get(ConvertCodesService);
    expect(service).toBeTruthy();
  });
});
