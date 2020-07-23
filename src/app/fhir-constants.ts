/**
 * FHIR types.
 */

/**
 * Research study status, from
 * https://www.hl7.org/fhir/valueset-research-study-status.html
 */
export enum ResearchStudyStatus {
  /**
   * Active
   * Study is opened for accrual.
   */
  ACTIVE = 'active',
  /**
   * Administratively Completed
   * Study is completed prematurely and will not resume; patients are no longer
   * examined nor treated.
   */
  ADMINISTRATIVELY_COMPLETED = 'administratively-completed',
  /**
   * Approved
   * Protocol is approved by the review board.
   */
  APPROVED = 'approved',
  /**
   * Closed to Accrual
   * Study is closed for accrual; patients can be examined and treated.
   */
  CLOSED_TO_ACCRUAL = 'closed-to-accrual',
  /**
   * Closed to Accrual and Intervention
   * Study is closed to accrual and intervention, i.e. the study is closed to
   * enrollment, all study subjects have completed treatment or intervention but
   * are still being followed according to the primary objective of the study.
   */
  CLOSED_TO_ACCRUAL_AND_INTERVENTION = 'closed-to-accrual-and-intervention',
  /**
   * Completed
   * Study is closed to accrual and intervention, i.e. the study is closed to
   * enrollment, all study subjects have completed treatment or intervention but
   * are still being followed according to the primary objective of the study.
   */
  COMPLETED = 'completed',
  /**
   * Disapproved
   * Protocol was disapproved by the review board.
   */
  DISAPPROVED = 'disapproved',
  /**
   * In Review
   * Protocol is submitted to the review board for approval.
   */
  IN_REVIEW = 'in-review',
  /**
   * Temporarily Closed to Accrual
   * Study is temporarily closed for accrual; can be potentially resumed in the
   * future; patients can be examined and treated.
   */
  TEMPORARILY_CLOSED_TO_ACCRUAL = 'temporarily-closed-to-accrual',
  /**
   * Temporarily Closed to Accrual and Intervention
   * Study is temporarily closed for accrual and intervention and potentially
   * can be resumed in the future.
   */
  TEMPORARILY_CLOSED_TO_ACCRUAL_AND_INTERVENTION = 'temporarily-closed-to-accrual-and-intervention',
  /**
   * Withdrawn
   * Protocol was withdrawn by the lead organization.
   */
  WITHDRAWN = 'withdrawn'
}

/**
 * The official display values for each research study status values.
 */
export const ResearchStudyStatusDisplay: Record<ResearchStudyStatus, string> = {
  /**
   * Active
   */
  active: 'Active',
  /**
   * Administratively Completed
   */
  'administratively-completed': 'Administratively Completed',
  /**
   * Approved
   */
  approved: 'Approved',
  /**
   * Closed to Accrual
   */
  'closed-to-accrual': 'Closed to Accrual',
  /**
   * Closed to Accrual and Intervention
   */
  'closed-to-accrual-and-intervention': 'Closed to Accrual and Intervention',
  /**
   * Completed
   */
  completed: 'Completed',
  /**
   * Disapproved
   */
  disapproved: 'Disapproved',
  /**
   * In Review
   */
  'in-review': 'In Review',
  /**
   * Temporarily Closed to Accrual
   */
  'temporarily-closed-to-accrual': 'Temporarily Closed to Accrual',
  /**
   * Temporarily Closed to Accrual and Intervention
   */
  'temporarily-closed-to-accrual-and-intervention': 'Temporarily Closed to Accrual and Intervention',
  /**
   * Withdrawn
   */
  withdrawn: 'Withdrawn'
};

/**
 * Research study phase, from
 * https://www.hl7.org/fhir/valueset-research-study-phase.html
 */
export enum ResearchStudyPhase {
  /**
   * N/A
   * Trials without phases (for example, studies of devices or behavioral
   * interventions).
   */
  NA = 'n-a',
  /**
   * Early Phase 1
   * Designation for optional exploratory trials conducted in accordance with
   * the United States Food and Drug Administration's (FDA) 2006 Guidance on
   * Exploratory Investigational New Drug (IND) Studies. Formerly called Phase
   * 0.
   */
  EARLY_PHASE_1 = 'early-phase-1',
  /**
   * Phase 1
   * Includes initial studies to determine the metabolism and pharmacologic
   * actions of drugs in humans, the side effects associated with increasing
   * doses, and to gain early evidence of effectiveness; may include healthy
   * participants and/or patients.
   */
  PHASE_1 = 'phase-1',
  /**
   * Phase 1/Phase 2
   * Trials that are a combination of phases 1 and 2.
   */
  PHASE_1_PHASE_2 = 'phase-1-phase-2',
  /**
   * Phase 2
   * Includes controlled clinical studies conducted to evaluate the
   * effectiveness of the drug for a particular indication or indications in
   * participants with the disease or condition under study and to determine the
   * common short-term side effects and risks.
   */
  PHASE_2 = 'phase-2',
  /**
   * Phase 2/Phase 3
   * Trials that are a combination of phases 2 and 3.
   */
  PHASE_2_PHASE_3 = 'phase-2-phase-3',
  /**
   * Phase 3
   * Includes trials conducted after preliminary evidence suggesting
   * effectiveness of the drug has been obtained, and are intended to gather
   * additional information to evaluate the overall benefit-risk relationship of
   * the drug.
   */
  PHASE_3 = 'phase-3',
  /**
   * Phase 4
   * Studies of FDA-approved drugs to delineate additional information including
   * the drug's risks, benefits, and optimal use.
   */
  PHASE_4 = 'phase-4'
}

/**
 * The official display values for the research study phases
 */
export const ResearchStudyPhaseDisplay: Record<ResearchStudyPhase, string> = {
  /**
   * N/A
   */
  'n-a': 'N/A',
  /**
   * Early Phase 1
   */
  'early-phase-1': 'Early Phase 1',
  /**
   * Phase 1
   */
  'phase-1': 'Phase 1',
  /**
   * Phase 1/Phase 2
   */
  'phase-1-phase-2': 'Phase 1/Phase 2',
  /**
   * Phase 2
   */
  'phase-2': 'Phase 2',
  /**
   * Phase 2/Phase 3
   */
  'phase-2-phase-3': 'Phase 2/Phase 3',
  /**
   * Phase 3
   * Includes trials conducted after preliminary evidence suggesting
   * effectiveness of the drug has been obtained, and are intended to gather
   * additional information to evaluate the overall benefit-risk relationship of
   * the drug.
   */
  'phase-3': 'Phase 3',
  /**
   * Phase 4
   */
  'phase-4': 'Phase 4'
};
