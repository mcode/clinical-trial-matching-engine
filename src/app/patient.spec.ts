import { Patient as FHIRPatient } from './fhir-types';
import Patient from 'src/app/patient';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

const patientData: FHIRPatient = {
  resourceType: 'Patient' as 'Patient',
  name: [
    {
      use: 'usual',
      text: 'ex',
      family: 'last',
      given: ['Usual']
    },
    {
      use: 'official',
      text: 'ex2',
      family: 'last',
      given: ['official']
    },
    {
      use: 'old',
      text: 'ex3',
      family: 'last',
      given: ['old']
    },
    {
      use: 'nickname',
      text: 'ex4',
      family: 'last',
      given: ['nickname']
    }
  ],
  address: [
    {
      use: 'home',
      postalCode: '01234'
    }
  ]
};
const patientData2: FHIRPatient = {
  resourceType: 'Patient' as 'Patient',
  name: [
    {
      use: 'old',
      text: 'ex3',
      family: 'last',
      given: ['old']
    },
    {
      use: 'anonymous',
      text: 'ex4',
      family: 'last',
      given: ['anonymous']
    }
  ],
  address: [
    {
      use: 'home',
      postalCode: '01234'
    }
  ]
};

const patientData3: FHIRPatient = {
  resourceType: 'Patient' as 'Patient'
};

const patientData4: FHIRPatient = {
  resourceType: 'Patient' as 'Patient',
  name: [
    {
      use: 'old',
      text: 'ex3',
      family: 'last',
      given: ['random']
    },
    {
      use: 'nickname',
      text: 'ex4',
      family: 'last',
      given: ['Nickname']
    }
  ],
  address: [
    {
      use: 'home',
      postalCode: '01234'
    }
  ]
};

describe('Patient Tests', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [HttpClientTestingModule] }));

  describe('#getUsualName()', () => {
    it('gets the usual name with multiple names', () => {
      expect(new Patient(patientData).getUsualName()).toEqual('Usual');
    });

    it('gets the first name in the record if there is no use: "usual" name', () => {
      expect(new Patient(patientData2).getUsualName()).toEqual('old');
    });

    it('returns null if there is no name in the patient record', () => {
      expect(new Patient(patientData3).getUsualName()).toBeNull();
    });
  });

  describe('#getPreferredName()', () => {
    it('returns null if there is no name in the patient record', () => {
      expect(new Patient(patientData3).getPreferredName()).toBeNull();
    });
    it('returns the use: "usual" name', () => {
      expect(new Patient(patientData).getPreferredName()).toEqual(patientData.name[0]);
    });

    it('returns the "best" name based on use', () => {
      expect(new Patient(patientData4).getPreferredName()).toEqual(patientData4.name[1]);
    });
  });

  describe('#getGender()', () => {
    it('should get gender as undefined when not specified ', () => {
      const patient: Patient = new Patient(patientData);
      expect(patient.getGender()).toBeUndefined();
    });
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
});
