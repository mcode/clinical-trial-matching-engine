import { OPDEStrings } from './customSearch';

describe('OPDEStrings', () => {
  it('pulls data from a patient bundle', () => {
    const actual = new OPDEStrings({
      resourceType: 'Bundle',
      type: 'searchset',
      entry: [
        {
          resource: {
            resourceType: 'Condition',
            meta: {
              profile: ['http://hl7.org/fhir/us/mcode/StructureDefinition/mcode-primary-cancer-condition']
            },
            clinicalStatus: {
              coding: [
                {
                  system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
                  code: 'active',
                  display: 'Active'
                }
              ]
            },
            verificationStatus: {
              coding: [
                {
                  system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
                  code: 'confirmed',
                  display: 'Confirmed'
                }
              ]
            },
            category: [
              {
                coding: [
                  {
                    system: 'http://snomed.info/sct',
                    code: '64572001'
                  }
                ]
              }
            ],
            code: {
              coding: [
                {
                  system: 'http://snomed.info/sct',
                  code: '408643008',
                  display: 'Infiltrating duct carcinoma of breast (disorder)'
                }
              ]
            },
            bodySite: [
              {
                coding: [
                  {
                    system: 'http://snomed.info/sct',
                    code: '76752008',
                    display: 'Breast structure (body structure)'
                  }
                ]
              }
            ],
            stage: [
              {
                summary: {
                  coding: [
                    {
                      system: 'http://cancerstaging.org',
                      code: '1',
                      display: 'I'
                    }
                  ]
                },
                assessment: [
                  {
                    reference: 'Observation/mCODEMassiveBioTNMClinicalStageGroupPatientExample01'
                  }
                ]
              }
            ]
          }
        }
      ]
    });
    expect(actual.primaryCancerCondition).toEqual(['Infiltrating duct carcinoma of breast (disorder)']);
  });
});
