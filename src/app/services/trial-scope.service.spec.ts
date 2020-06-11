import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpClientModule } from '@angular/common/http';
import { TrialScopeService } from './trial-scope.service';

describe('TrialScopeService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [HttpClientTestingModule],
    providers: [TrialScopeService]
  }));

  it('should be created', () => {
    const service: TrialScopeService = TestBed.get(TrialScopeService);
    expect(service).toBeTruthy();
  });
});
