import { Resource } from './fhir-types';
import { PatientBundle } from './bundle';
import { deepClone, FhirPathFilter, FhirComponentPathFilter, FhirCodeRemapFilter, FhirFilter } from './fhir-filter';

const createCondition = (includeExtension = true): Resource => {
  const result = {
    resourceType: 'Condition',
    id: 'testCondition',
    meta: {
      profile: ['http://hl7.org/fhir/us/mcode/StructureDefinition/mcode-primary-cancer-condition']
    }
  };
  if (includeExtension) {
    result['extension'] = [
      {
        url: 'http://hl7.org/fhir/us/mcode/StructureDefinition/mcode-histology-morphology-behavior',
        valueCodeableConcept: {
          coding: [
            {
              system: 'http://snomed.info/sct',
              code: '399935008'
            }
          ]
        }
      }
    ];
  }
  return result;
};
const createObservation = (): Resource => {
  return {
    resourceType: 'Observation',
    id: 'testObservation',
    meta: {
      profile: ['http://hl7.org/fhir/us/mcode/StructureDefinition/mcode-tumor-marker']
    },
    status: 'final',
    category: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/observation-category',
            code: 'laboratory'
          }
        ]
      }
    ],
    code: {
      coding: [
        {
          system: 'http://loinc.org',
          code: '40557-1'
        }
      ]
    },
    valueCodeableConcept: {
      coding: [
        {
          system: 'http://snomed.info/sct',
          code: '260385009'
        }
      ]
    }
  };
};
const createBundle = (...entries: Resource[]): PatientBundle => {
  return {
    resourceType: 'Bundle',
    type: 'searchset',
    entry: entries.map((entry) => {
      return {
        fullUrl: 'http://www.example.com/',
        resource: entry
      };
    })
  };
};

describe('deepClone()', () => {
  it('clones an object', () => {
    const example = {
      foo: [{ hello: 'world' }, { test: 'object' }, 'string', true, null, 1],
      bar: {
        quz: 'baz'
      }
    };
    const clone = deepClone(example);
    expect(clone).toEqual(example);
    expect(clone === example).toBeFalse();
    // This is another "is actually the same" test
    expect(JSON.stringify(example)).toEqual(JSON.stringify(clone));
  });
});

describe('FhirFilter', () => {
  // The bundle filter code is in the base class
  it('filters a bundle', () => {
    const filter = new FhirFilter();
    // Make this simple: remove all condition entries
    filter.filterResource = (resource: Resource): Resource => {
      return resource.resourceType === 'Condition' ? null : resource;
    };
    expect(filter.filterBundle(createBundle(createCondition(), createObservation()))).toEqual(
      createBundle(createObservation())
    );
  });
});

describe('FhirPathFilter', () => {
  it('filters based on a path', () => {
    const filter = new FhirPathFilter(
      "Condition.meta.profile = 'http://hl7.org/fhir/us/mcode/StructureDefinition/mcode-primary-cancer-condition'"
    );
    expect(filter.filterResource(createCondition())).toBeNull();
    // Make sure that this does not alter something it shouldn't
    // (The double call is to create a new copy in case it altered the original)
    expect(filter.filterResource(createObservation())).toEqual(createObservation());
  });
});

describe('FhirComponentPathFilter', () => {
  it('filters out a component', () => {
    const filter = new FhirComponentPathFilter('Condition.extension', {
      element: {
        include: "url = 'http://hl7.org/fhir/us/mcode/StructureDefinition/mcode-histology-morphology-behavior'"
      }
    });
    expect(filter.filterResource(createCondition(true))).toEqual(createCondition(false));
  });
});

describe('FhirCodeRemapFilter', () => {
  let resource: Resource;
  beforeEach(() => {
    resource = {
      resourceType: 'Condition',
      meta: {
        profile: ['http://hl7.org/fhir/us/mcode/StructureDefinition/mcode-primary-cancer-condition']
      },
      code: {
        coding: [
          {
            system: 'http://snomed.info/sct',
            code: '408643008',
            display: 'Infiltrating duct carcinoma of breast (disorder)'
          }
        ]
      }
    };
  });

  it('remaps a code', () => {
    const filter = new FhirCodeRemapFilter(
      'Condition',
      'http://hl7.org/fhir/us/mcode/StructureDefinition/mcode-primary-cancer-condition',
      [
        [
          {
            system: 'http://snomed.info/sct',
            code: '408643008'
          },
          {
            system: 'http://snomed.info/sct',
            code: '254837009',
            display: 'Malignant neoplasm of breast'
          }
        ]
      ]
    );
    expect(filter.filterResource(resource)).not.toBeNull();
    expect(resource.code).toEqual({
      coding: [{ system: 'http://snomed.info/sct', code: '254837009', display: 'Malignant neoplasm of breast' }]
    });
  });
});
