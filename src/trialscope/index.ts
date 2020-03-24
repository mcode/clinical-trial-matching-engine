// Note: this will likely change in the future to a more sensible default object
import { TrialScopeResult as TSR, default as TrialScopeEndpoint } from './client';

export default TrialScopeEndpoint;
// There has to be a better way to re-export types
export type TrialScopeResult = TSR;
