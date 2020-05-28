/**
 * Provides an object model around the TrialScope API.
 */

type ID = string | number;

/**
 * Clinical trial site
 */
export interface Site {
  city: string;
  contactEmail: string;
  contactName: string;
  contactPhone: string;
  contactPhoneExt: string;
  country: string;
  facility: string;
  id: ID;
  latitude: number;
  longitude: number;
  state: string;
  /**
   * "Not yet recruiting", "Recruiting", "Enrolling by invitation",
   * "Active, not recruiting", "Suspended", "Terminated", "Completed",
   * "Withdrawn", "Unknown"
   */
  status: string;
  url: string;
  zipCode: string;
 }

/**
 * Represents a Trial as returned by TrialScope. Technically this maps to the
 * "Match" returns by advancedMatches. baseMatches returns the same set of
 * fields, but adds a few additional ones in what is the official "Trial" object
 * in the TrialScope schema. However, for simplicity's sake, the "Match" object
 * is called a "Trial" and the additional fields are added via extension.
 */
export interface Trial {
  /**
   * U.S. Fed, NIH, Industry, Other
   */
  agencyClass: string;

  /**
   * The disease, disorder, syndrome, illness, or injury that is being studied.
   * Conditions may also include other health-related issues, such as lifespan,
   * quality of life, and health risks.
   */
  conditions: string;

  /**
   * Countries where the trial is recruiting
   */
  // FIXME: Really a string? Not an array?
  countries: string;

  /**
   * The key requirements that people who want to participate in a clinical
   * study must meet or the characteristics they must have. Eligibility criteria
   * consist of both inclusion criteria (which are required for a person to
   * participate in the study) and exclusion criteria (which prevent a person
   * from participating). Types of eligibility criteria include whether a study
   * accepts healthy volunteers, has age or age group requirements, or is
   * limited by sex.
   */
  criteria: string;

  /**
   * Summary of the clinical trial's goals
   */
  description: string;

  /**
   * In-depth description of the clinical trial's goals
   */
  detailedDescription: string;

  /**
   * Person's gender. Can be unknown, female, or male
   */
  gender: string;

  /**
   * A way for patients with serious diseases or conditions who cannot
   * participate in a clinical trial to gain access to a medical product that
   * has not been approved by the U.S. Food and Drug Administration (FDA).
   */
  hasExpandedAccess: string;

  /**
   * A type of eligibility criteria that indicates whether people who do not
   * have the condition/disease being studied can participate in that clinical
   * study.
   */
  healthyVolunteers: string;

  /**
   * An agency within the U.S. Department of Health and Human Services. The FDA
   * is responsible for protecting the public health by making sure that human
   * and veterinary drugs, vaccines and other biological products, medical
   * devices, the Nation's food supply, cosmetics, dietary supplements, and
   * products that give off radiation are safe, effective, and secure.
   */
  isFdaRegulated: string;

  /**
   * Terms tagged by the sponsore
   */
  keywords: string;

  /**
   * Description of website associated with clinical trial
   */
  linkDescription: string;

  /**
   * Website associated with clinical trial
   */
  linkUrl: string;

  /**
   * Youngest age of eligibility
   */
  maximumAge: number;

  /**
   * Oldest age of eligibility
   */
  minimumAge: number;

  /**
   * The unique identification code given to each clinical study upon
   * registration at ClinicalTrials.gov. The format is "NCT" followed by an
   * 8-digit number (for example, NCT00000419).
   */
  nctId: string;

  /**
   * The official title of a protocol used to identify a clinical study or a short title written in language intended for the lay public.
   */
  officialTitle: string;

  /**
   * Email address for main contact
   */
  overallContactEmail: string;

  /**
   * Main contact for trial
   */
  overallContactName: string;

  /**
   * Phone number for main contact
   */
  overallContactPhone: string;

  /**
   * Affiliation of overall official
   */
  overallOfficialAffilitation: string;

  /**
   * Overall official
   */
  overallOfficialName: string;

  /**
   * Role of the overall official
   */
  overallOfficialRole: string;

  /**
   * 'Active, not recruiting', 'Approved for marketing', 'Available', 'Enrolling by invitation', 'Not yet recruiting', 'Recruiting'
   */
  overallStatus: string;

  /**
   * Early Phase 1, N/A, Phase 1, Phase 1/Phase 2, Phase 2, Phase 2/Phase 3, Phase 3, Phase 4
   */
  phase: string;

  /**
   * Locations where trial is conducted
   */
  sites: [Site];

  /**
   * The organization or person who initiates the study and who has authority and control over the study.
   */
  sponsor: string;

  /**
   * Expanded Access, Interventional, Observational, Observational [Patient Registry]
   */
  studyType: string;

  title: string;
}

export interface AdvancedMatchCondition {
  /**
   * Review of a trial based for a given advanced match condition
   */
  //advancedMatchConditionReview: AdvancedMatchConditionReview!

  /**
   * Trial Conditions this Advanced Match Condition applies to
   */
  conditions: string;

  /**
   * Email Contact for trial labeling team
   */
  email: string;

  /**
   * Condition schema
   */
  formSchema: string;

  /**
   * Name of Advanced Match Condition
   */
  name: string;
}

/**
 * The match returned by the baseMatches search.
 */
export interface BaseTrial extends Trial {
  /**
   * Condition specific schemas relevant to this trial
   */
  advancedMatchConditions: AdvancedMatchCondition[];

  /**
   * A group or subgroup of participants in a clinical trial that receives a
   * specific intervention/treatment, or no intervention, according to the
   * trial's protocol.
   */
  //armGroups: JSON!

  /**
   * A process or action that is the focus of a clinical study. Interventions
   * include drugs, medical devices, procedures, vaccines, and other products
   * that are either investigational or already available. Interventions can
   * also include noninvasive approaches, such as education or modifying diet
   * and exercise.
   */
  //interventions: JSON!

  /**
   * NLM's Medical Subject Headings (MeSH)-controlled vocabulary thesaurus
   */
  //meshTerms: [MeshTerms!]!
}

/**
 * A type alias for the Match object.
 */
export type Match = Trial;
