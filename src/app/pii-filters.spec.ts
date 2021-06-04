import { Patient } from './fhir-types';
import { anonymizeDate, PatientFilter } from './pii-filters';

describe('anonymizeDate', () => {
  it('anonymizes dates as strings', () => {
    expect(anonymizeDate('2021', 1931)).toBe('2021');
    expect(anonymizeDate('2021-04', 1931)).toBe('2021');
    expect(anonymizeDate('2021-04-10', 1931)).toBe('2021');
  });
  it('anonymizes dates as dates', () => {
    expect(anonymizeDate(new Date(2021, 1, 1), new Date(1931, 1, 1))).toBe('2021');
  });
  it('caps dates to the oldest year given', () => {
    expect(anonymizeDate('1950-02-03', 1970)).toBe('1970');
  });
  it('caps dates to 90 years prior to now by default', () => {
    // This test involves knowing when "today" is, so
    jasmine.clock().mockDate(new Date(2021, 6, 4));
    jasmine.clock().withMock(() => {
      expect(anonymizeDate('1920')).toBe('1931');
      expect(anonymizeDate(new Date(1930, 12, 20))).toBe('1931');
    });
  });
});

describe('PatientFilter', () => {
  it('filters out PII fields', () => {
    // First, the record with potential PII
    const original: Patient = {
      resourceType: 'Patient',
      identifier: [
        {
          use: 'usual',
          system: 'http://www.example.com/invented',
          value: 'Fake'
        }
      ],
      active: true,
      name: [
        {
          use: 'official',
          text: 'Testy McTestface',
          family: 'McTestface',
          given: ['Testy']
        }
      ],
      telecom: [
        {
          system: 'phone',
          value: '781-555-0100',
          use: 'work',
          rank: 1
        },
        {
          system: 'email',
          value: 'test@example.com',
          use: 'work',
          rank: 2
        }
      ],
      gender: 'male',
      birthDate: '2000-04-10',
      address: [
        {
          use: 'home',
          type: 'both',
          line: ['123 Fake St'],
          city: 'Exampleville',
          state: 'MA',
          postalCode: '01234',
          country: 'USA'
        }
      ],
      maritalStatus: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/v3-MaritalStatus',
            code: 'S',
            display: 'Never Married'
          }
        ],
        text: 'Never Married'
      },
      multipleBirthBoolean: false,
      photo: [
        {
          contentType: 'image/jpeg',
          data: 'not actually an image'
        }
      ],
      contact: [
        {
          relationship: {
            coding: [
              {
                system: 'http://hl7.org/fhir/ValueSet/patient-contactrelationship',
                code: 'C',
                display: 'Emergency Contact'
              }
            ],
            text: 'Emergency Contact'
          },
          name: {
            use: 'usual',
            text: 'Mom McTestface',
            family: 'McTestface',
            given: ['Mom']
          },
          gender: 'female'
        }
      ],
      communication: [
        {
          language: {
            coding: [
              {
                system: 'http://hl7.org/fhir/ValueSet/languages',
                code: 'en-US',
                display: 'English (United States)'
              }
            ],
            text: 'English (United States)'
          },
          preferred: true
        }
      ],
      generalPractitioner: [
        {
          reference: '#general-practitioner',
          type: 'Practioner'
        }
      ],
      managingOrganization: [
        {
          reference: '#mcode',
          type: 'Organization'
        }
      ]
    };
    const filter = new PatientFilter();
    expect(filter.filterResource(original)).toEqual({
      resourceType: 'Patient',
      active: true,
      name: [
        {
          use: 'anonymous',
          text: 'Anonymous',
          family: 'Anonymous',
          given: ['Anonymous']
        }
      ],
      gender: 'male',
      birthDate: '2000',
      maritalStatus: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/v3-MaritalStatus',
            code: 'S',
            display: 'Never Married'
          }
        ],
        text: 'Never Married'
      },
      multipleBirthBoolean: false
    });
  });
});
