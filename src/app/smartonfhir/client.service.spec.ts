import { TestBed } from '@angular/core/testing';

import { ClientService } from './client.service';

describe('ClientService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ClientService = TestBed.get(ClientService);
    expect(service).toBeTruthy();
  });
  it('should get client', () => {
    const service: ClientService = TestBed.get(ClientService);
    expect(service.getClient()).toBeDefined();
  });
  it('should get patient', () => {
    const service: ClientService = TestBed.get(ClientService);
    expect(service.getPatient()).toBeDefined();
  });
  it('should get record', () => {
    const service: ClientService = TestBed.get(ClientService);
    expect(service.getRecords('')).toBeDefined();
  });
  it('should get all records', () => {
    const service: ClientService = TestBed.get(ClientService);
    expect(service.getAllRecords('')).toBeDefined();
  });
  it('should get conditions', () => {
    const service: ClientService = TestBed.get(ClientService);
    expect(service.getConditions()).toBeDefined();
  });
  it('should get conditions w/ parameter', () => {
    const service: ClientService = TestBed.get(ClientService);
    expect(service.getConditions({ id: 'example' })).toBeDefined();
  });
  it('should get resources', () => {
    const service: ClientService = TestBed.get(ClientService);
    expect(service.getResources('')).toBeDefined();
  });
  it('should get resources w parameters', () => {
    const service: ClientService = TestBed.get(ClientService);
    expect(service.getResources('', { id: 'example' })).toBeDefined();
  });
});
