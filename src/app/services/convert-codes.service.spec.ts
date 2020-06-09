import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpClientModule } from '@angular/common/http';
import { ConvertCodesService } from './convert-codes.service';

describe('ConvertCodesService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [HttpClientTestingModule],
    providers: [ConvertCodesService]
  }));

  it('should be created', () => {
    const service: ConvertCodesService = TestBed.get(ConvertCodesService);
    expect(service).toBeTruthy();
  });
});
