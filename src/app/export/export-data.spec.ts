import { ExportTrials } from './export-data';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('export data', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: []
    })
  );
  it('should export data', () => {
    expect(ExportTrials).toBeDefined();
  });
});
