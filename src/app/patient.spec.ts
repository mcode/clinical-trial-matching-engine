import Patient from 'src/app/patient';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

const patientData = {
  resourceType: 'Patient' as 'Patient',
  name: [
    {
      use: 'usual',
      text: 'ex',
      family: 'last',
      given: 'first'
    },
    {
      use: 'official',
      text: 'ex2',
      family: 'last',
      given: 'first'
    },
    {
      use: 'random',
      text: 'ex3',
      family: 'last',
      given: 'first'
    },
    {
      use: 'random2',
      text: 'ex4',
      family: 'last',
      given: 'first'
    }
  ],
  address: [
    {
      use: 'official',
      postalCode: '01234'
    }
  ]
};
const patientData2 = {
  resourceType: 'Patient' as 'Patient',
  name: [
    {
      use: 'random',
      text: 'ex3',
      family: 'last',
      given: 'first'
    },
    {
      use: 'random2',
      text: 'ex4',
      family: 'last',
      given: 'first'
    }
  ],
  address: [
    {
      use: 'official',
      postalCode: '01234'
    }
  ]
};
const patientData3 = {
  resourceType: 'Patient' as 'Patient',
  name: null
};
const patientData4 = {
  resourceType: 'Patient' as 'Patient',
  name: [
    {
      use: 'random',
      text: 'ex3',
      family: 'last',
      given: 'first'
    },
    {
      use: 'nickname',
      text: 'ex4',
      family: 'last',
      given: 'first'
    }
  ],
  address: [
    {
      use: 'official',
      postalCode: '01234'
    }
  ]
};

describe('Patient Tests', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [HttpClientTestingModule] }));

  it('should get usual name ', () => {
    const patient: Patient = new Patient(patientData);

    expect(patient.getUsualName()).toBeNull();
  });

  it('should get usual name as null ', () => {
    const patient: Patient = new Patient(patientData2);

    expect(patient.getUsualName()).toBeNull();
  });
  it('should get usual name as null when name is null', () => {
    const patient: Patient = new Patient(patientData3);

    expect(patient.getUsualName()).toBeNull();
  });
  it('should get usual name ', () => {
    const patient: Patient = new Patient(patientData2);

    expect(patient.getUsualName()).toBeNull();
  });
  it('should get preferred name as null ', () => {
    const patient: Patient = new Patient(patientData3);

    expect(patient.getPreferredName()).toBeNull();
  });
  it('should get preferred name ', () => {
    const patient: Patient = new Patient(patientData);

    expect(patient.getPreferredName()).toBeDefined();
  });
  it('should get gender as undefined when not specified ', () => {
    const patient: Patient = new Patient(patientData);

    expect(patient.getGender()).toBeUndefined();
  });
  it('should get age as undefined when not specified ', () => {
    const patient: Patient = new Patient(patientData);

    expect(patient.getAge()).toBeNaN();
  });
  it('should get home address ', () => {
    const patient: Patient = new Patient(patientData);

    expect(patient.getHomeAddress()).toBeDefined();
  });
  it('should get home address as null when none', () => {
    const patient: Patient = new Patient(patientData3);

    expect(patient.getHomeAddress()).toBeDefined();
  });
  it('should get home postal code ', () => {
    const patient: Patient = new Patient(patientData3);

    expect(patient.getHomePostalCode()).toBeNull();
  });

  it('should get name in preffered order ', () => {
    const patient: Patient = new Patient(patientData2);

    expect(patient.getPreferredName()).toBeDefined();
  });
  it('should get preffered name with unknown uses', () => {
    const patient: Patient = new Patient(patientData4);

    expect(patient.getPreferredName()).toBeDefined();
  });
});
