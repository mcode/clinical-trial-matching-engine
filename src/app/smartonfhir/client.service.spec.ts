import { TestBed } from '@angular/core/testing';

import { promise } from 'protractor';

import { ClientService } from './client.service';

describe('ClientService', () => {
  let service: ClientService;
  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ClientService);
  });

  describe('#getPatient', () => {
    it('should get the patient', () => {
      return expectAsync(service.getPatient()).toBeResolved();
    });
  });
});
