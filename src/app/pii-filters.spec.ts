import { Bundle, JsonObject, Patient } from './fhir-types';
import { AnonymizeBundleFilter, anonymizeDate, AnonymizeFilter, PatientFilter, updateReferences } from './pii-filters';

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
  it('handles an invalid string', () => {
    expect(anonymizeDate('not a date')).toEqual('');
  });
});

describe('PatientFilter', () => {
  beforeEach(() => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(2021, 6, 4));
  });
  afterEach(() => {
    jasmine.clock().uninstall();
  });

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
    } as Patient);
  });
});

describe('AnonymizeBundleFilter', () => {
  it('removes URLs and other info from a bundle', () => {
    const filter = new AnonymizeBundleFilter();
    expect(
      filter.filterBundle({
        resourceType: 'Bundle',
        type: 'searchset',
        identifier: {
          use: 'temp',
          system: 'urn:ietf:rfc:3986',
          value: 'https://www.example.com/fhirserver/invented'
        },
        entry: [
          {
            resource: {
              resourceType: 'Patient',
              id: 'patient/1'
            },
            fullUrl: 'https://www.example.com/fhirserver/patient/1',
            search: {
              mode: 'match',
              score: 0.75
            },
            link: [
              {
                relation: 'canonical',
                url: 'https://www.example.com/fhirserver/patient/1'
              }
            ],
            request: {
              method: 'GET',
              url: 'https://www.example.com/fhirserver/patient/1'
            },
            response: {
              status: '200 OK'
            }
          }
        ],
        link: [
          {
            relation: 'canonical',
            url: 'https://www.example.com/fhirserver/search/'
          },
          {
            relation: 'next',
            url: 'https://www.example.com/fhirserver/search/2'
          }
        ]
      })
    ).toEqual({
      resourceType: 'Bundle',
      type: 'searchset',
      entry: [
        {
          resource: {
            resourceType: 'Patient',
            id: '0'
          },
          search: {
            mode: 'match',
            score: 0.75
          }
        }
      ]
    } as Bundle);
  });
});

describe('updateReferences()', () => {
  // "Standard" idMap to use for each test
  let idMap: Map<string, string>;
  beforeEach(() => {
    idMap = new Map<string, string>([
      ['old', 'new'],
      ['bar', 'baz']
    ]);
  });
  it('removes unknown references', () => {
    const testExternalRef: JsonObject = {
      ref: {
        reference: 'https://www.example.com/resource',
        type: 'Observation'
      }
    };
    expect(updateReferences(testExternalRef, 'ref', idMap)).toBeFalse();
    expect(testExternalRef).toEqual({});
    const testMissingRef: JsonObject = {
      ref: {
        reference: '#resource',
        type: 'Observation'
      }
    };
    expect(updateReferences(testMissingRef, 'ref', idMap)).toBeFalse();
    expect(testMissingRef).toEqual({});
  });
  it("accepts paths that don't exist", () => {
    const testObj: JsonObject = {
      ref: {
        reference: '#foo',
        type: 'Observation'
      }
    };
    expect(updateReferences(testObj, 'reference', idMap)).toBeTrue();
    expect(testObj).toEqual({
      ref: {
        reference: '#foo',
        type: 'Observation'
      }
    } as JsonObject);
  });
  it('rewrites known references', () => {
    const obj: JsonObject = {
      ref: {
        reference: '#old',
        type: 'Condition'
      }
    };
    expect(updateReferences(obj, 'ref', idMap)).toBeTrue();
    expect(obj).toEqual({
      ref: {
        reference: '#new',
        type: 'Condition'
      }
    } as JsonObject);
  });
  it('rewrites and removes as required lists of references', () => {
    const obj: JsonObject = {
      foo: [
        {
          reference: '#old',
          type: 'Condition'
        },
        {
          reference: 'https://www.example.com/external',
          type: 'Condition'
        },
        {
          reference: '#bar',
          type: 'Condition'
        },
        {
          reference: '#unknown',
          type: 'Condition'
        }
      ]
    };
    expect(updateReferences(obj, 'foo', idMap)).toBeTrue();
    expect(obj).toEqual({
      foo: [
        {
          reference: '#new',
          type: 'Condition'
        },
        {
          reference: '#baz',
          type: 'Condition'
        }
      ]
    } as JsonObject);
  });
  it('rewrites nested references to a single object', () => {
    const obj: JsonObject = {
      foo: {
        ref: {
          reference: '#old',
          type: 'Condition'
        }
      }
    };
    expect(updateReferences(obj, ['foo', 'ref'], idMap)).toBeTrue();
    expect(obj).toEqual({
      foo: {
        ref: {
          reference: '#new',
          type: 'Condition'
        }
      }
    } as JsonObject);
  });
  it('rewrites nested references to multiple objects', () => {
    const obj: JsonObject = {
      foo: {
        bar: [
          {
            reference: '#old',
            type: 'Condition'
          },
          {
            reference: '#bar',
            type: 'Condition'
          }
        ]
      }
    };
    expect(updateReferences(obj, ['foo', 'bar'], idMap)).toBeTrue();
    expect(obj).toEqual({
      foo: {
        bar: [
          {
            reference: '#new',
            type: 'Condition'
          },
          {
            reference: '#baz',
            type: 'Condition'
          }
        ]
      }
    } as JsonObject);
  });
  it("handles paths that point to things that aren't references", () => {
    const obj: JsonObject = {
      foo: 'hello'
    };
    expect(updateReferences(obj, 'foo', idMap)).toBeTrue();
    expect(obj).toEqual({
      foo: 'hello'
    } as JsonObject);
    obj.foo = ['hello'];
    expect(updateReferences(obj, 'foo', idMap)).toBeTrue();
    expect(obj).toEqual({
      foo: ['hello']
    } as JsonObject);
  });
  it('handles double-arrays in a path (by ignoring them)', () => {
    const obj: JsonObject = {
      foo: [
        [
          {
            reference: '#old',
            type: 'Condition'
          }
        ]
      ]
    };
    expect(updateReferences(obj, 'foo', idMap)).toBeTrue();
    expect(obj).toEqual({
      foo: [
        [
          {
            reference: '#old',
            type: 'Condition'
          }
        ]
      ]
    } as JsonObject);
  });
});

describe('AnonymizeFilter', () => {
  beforeEach(() => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(2021, 6, 4));
  });
  afterEach(() => {
    jasmine.clock().uninstall();
  });
  describe('#filterResource', () => {
    it('invokes the proper child filters', () => {
      // The question here isn't if just that it produces the expected results,
      // it's that it does it using the child filters.
      const filter = new AnonymizeFilter();
      const anonymizeBundleSpy = spyOn(filter.bundleFilter, 'filterResource').and.callThrough();
      const patientFilterSpy = spyOn(filter.patientFilter, 'filterResource').and.callThrough();
      expect(
        filter.filterResource({
          resourceType: 'Patient',
          identifier: [
            {
              use: 'usual',
              system: 'http://www.example.com/invented',
              value: 'Fake'
            }
          ],
          active: false,
          name: [
            {
              use: 'official',
              text: 'Corpse McDeadbody',
              family: 'McDeadbody',
              given: ['Corpse']
            }
          ],
          gender: 'male',
          birthDate: '1901',
          deceasedDateTime: '2020-05-15T12:00:00Z',
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
          managingOrganization: [
            {
              reference: '#mcode',
              type: 'Organization'
            }
          ]
        })
      ).toEqual({
        resourceType: 'Patient',
        active: false,
        name: [
          {
            use: 'anonymous',
            text: 'Anonymous',
            family: 'Anonymous',
            given: ['Anonymous']
          }
        ],
        gender: 'male',
        birthDate: '1932',
        deceasedDateTime: '2020'
      } as Patient);
      expect(anonymizeBundleSpy).toHaveBeenCalledTimes(1);
      expect(patientFilterSpy).toHaveBeenCalledTimes(1);
    });
  });
  describe('#filterBundle', () => {
    it('invokes the proper child filters', () => {
      // The question here isn't if just that it produces the expected results,
      // it's that it does it using the child filters.
      const filter = new AnonymizeFilter();
      const anonymizeBundleSpy = spyOn(filter.bundleFilter, 'filterBundle').and.callThrough();
      const patientFilterSpy = spyOn(filter.patientFilter, 'filterResource').and.callThrough();
      const annotationFilterSpy = spyOn(filter.annotationFilter, 'filterResource').and.callThrough();
      expect(
        filter.filterBundle({
          resourceType: 'Bundle',
          type: 'searchset',
          identifier: {
            use: 'temp',
            system: 'urn:ietf:rfc:3986',
            value: 'https://www.example.com/fhirserver/invented'
          },
          entry: [
            {
              resource: {
                resourceType: 'Patient',
                id: 'CorpseMcDeadbody',
                identifier: [
                  {
                    use: 'usual',
                    system: 'http://www.example.com/invented',
                    value: 'Fake'
                  }
                ],
                active: false,
                name: [
                  {
                    use: 'official',
                    text: 'Corpse McDeadbody',
                    family: 'McDeadbody',
                    given: ['Corpse']
                  }
                ],
                gender: 'male',
                birthDate: '1901',
                deceasedDateTime: '2020-05-15T12:00:00Z',
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
                managingOrganization: [
                  {
                    reference: '#mcode',
                    type: 'Organization'
                  }
                ]
              },
              fullUrl: 'https://www.example.com/fhirserver/patient/2',
              search: {
                mode: 'match',
                score: 0.75
              }
            },
            {
              resource: {
                resourceType: 'Condition',
                subject: {
                  reference: '#CorpseMcDeadbody',
                  display: 'Corpse McDeadbody'
                },
                note: [
                  {
                    text: 'Example text'
                  }
                ]
              }
            }
          ],
          link: [
            {
              relation: 'next',
              url: 'https://www.example.com/fhirserver/search/2'
            }
          ]
        })
      ).toEqual({
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [
          {
            resource: {
              resourceType: 'Patient',
              id: '0',
              active: false,
              name: [
                {
                  use: 'anonymous',
                  text: 'Anonymous',
                  family: 'Anonymous',
                  given: ['Anonymous']
                }
              ],
              gender: 'male',
              birthDate: '1932',
              deceasedDateTime: '2020'
            },
            search: {
              mode: 'match',
              score: 0.75
            }
          },
          {
            resource: {
              resourceType: 'Condition',
              subject: {
                reference: '#0'
              }
            }
          }
        ]
      } as Bundle);
      expect(anonymizeBundleSpy).toHaveBeenCalledTimes(1);
      expect(patientFilterSpy).toHaveBeenCalledTimes(1);
      expect(annotationFilterSpy).toHaveBeenCalledTimes(2);
    });
  });
});
