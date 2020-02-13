declare module 'clinical-trials-model' {
    export interface ClinicalTrial {
      name: string;
      description?: string;
      source: string; // link for the trial for display purposes
      library: string;
      criteria: Criteria[];
    }
  
    export interface Criteria {
      elementName: string; // name of the mCODE element
      expected: string; // human readable value
      type: string; // inclusion or exclusion
      cql: string; // cql to fetch the value from a patient
    }
  
    export interface ClinicalTrialResult {
      name: string;
      description?: string;
      source: string;
      criteria: CriteriaEvaluation[]; // list of each of the evaluated criteria
      result: string; // elibible, ineligible, or potentially eligible
    }
  
    export interface CriteriaEvaluation {
      // doesn't extend Criteria because we don't care about the cql here,
      // and don't want to make it optional in Criteria
  
      elementName: string; // name of the mCODE element
      expected: string; // human readable value
      actual: string;
      type: string; // inclusion or exclusion
      match: boolean | null; // in case expected !== actual but they are still a match
    }
  
    export interface PatientTrialMatchResult {
        name: string; // patient name to be displayed
        patientId: number; // from the FHIR server identifier
        matchResult: ClinicalTrialResult[]; // list of all of the trials that were checked against
    }
  }
  