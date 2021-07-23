import { Injectable } from '@angular/core';
// of renamed because it's also a keyword
import { Observable, of as observableOf } from 'rxjs';

import Patient from '../patient';
import { BundleEntry, CodeableConcept, Condition } from '../fhir-types';
import { ClientService, QueryParameters } from '../smartonfhir/client.service';
import { FhirPathFilter, deepClone } from '../fhir-filter';
import { MCODE_PRIMARY_CANCER_CONDITION, MCODE_HISTOLOGY_MORPHOLOGY_BEHAVIOR } from '../mcode';

export type PatientEventType = 'progress' | 'complete';

/**
 * Notification that a chunk of patient data has been loaded. If 'complete', entries is all the loaded entries. If
 * 'progress', it contains a chunk of entries just loaded. On 'progress', total will only be set if it is currently
 * known - on the initial few events it may not be. Loaded is the number of entries currently loaded, including entries
 * in the current 'progress' event.
 */
export class PatientDataEvent {
  constructor(
    public type: PatientEventType,
    public loaded: number,
    public entries: BundleEntry[],
    public total?: number
  ) {}
}

/**
 * Service that wraps the FHIR client to cache data and manage loading patient resources from it.
 */
@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private patient: Patient;
  private pendingPatient: Promise<Patient> | null = null;
  private patientData?: BundleEntry[];
  private originalPatientData?: BundleEntry[];
  private pendingObservable: Observable<PatientDataEvent> | null = null;
  constructor(private fhirClient: ClientService) {}

  /**
   * Clears all cache entries. Does not cancel any pending loads - if there are outstanding loads that have not been
   * completed, they will still be cached when they do complete. At present there is no way to cancel a pending load
   * due to the way the FHIR client works.
   */
  clear(): void {
    this.patient = undefined;
    this.patientData = undefined;
    this.originalPatientData = undefined;
  }

  /**
   * Loads the Patient record from the FHIR server. This will only load data on the first call, once the record has been
   * successfully loaded once, it will instead return a Promise that immediately resolves to that loaded Patient.
   * @returns a Promise that resolves to the Patient
   */
  getPatient(): Promise<Patient> {
    if (this.patient) {
      return Promise.resolve(this.patient);
    } else if (this.pendingPatient !== null) {
      return this.pendingPatient;
    } else {
      return (this.pendingPatient = this.fhirClient.getPatient().then((patient) => {
        this.patient = new Patient(patient);
        return this.patient;
      }));
    }
  }

  /**
   * Gets any loaded patient data. Does not attempt to load it if it has not been loaded.
   * @returns patient data if it has been loaded, undefined if it has not
   */
  getPatientData(): BundleEntry[] | undefined {
    return this.patientData;
  }

  /**
   * Loads patient data from the FHIR server. This will only load data on the first call, once the data has been loaded,
   * it will return the cached data.
   * @returns an Observable that pushes events as patient data is loaded
   */
  loadPatientData(): Observable<PatientDataEvent> {
    if (this.patientData) {
      // If we have the patient data, immediately return it
      return observableOf(
        new PatientDataEvent('complete', this.patientData.length, this.patientData, this.patientData.length)
      );
    }
    if (this.pendingObservable) return this.pendingObservable;
    // Otherwise, we have to fetch it
    return (this.pendingObservable = new Observable((subscriber) => {
      // Default queries
      const resourceQueries: Record<string, QueryParameters> = {
        Patient: {},
        Condition: { 'clinical-status': 'active' },
        MedicationStatement: {},
        Observation: {},
        Procedure: {}
      };
      // Step 1 is seeing if this patient has a known cancer diagnosis
      this.fhirClient
        .getAllRecords('Condition', {
          _profile: 'http://hl7.org/fhir/us/mcode/StructureDefinition/mcode-primary-cancer-condition'
        })
        .subscribe(
          (next) => {
            if (next.elements.length > 0) {
              // get onset date of primary cancer condition
              const dateString = next.elements[0]['resource']['onsetDateTime'];
              if (dateString) {
                const newDate = new Date(dateString);
                newDate.setFullYear(newDate.getFullYear() - 2);
                const newStringDate = newDate.toISOString();
                // set search params for resource types: date more recent than 2 years before the primary cancer condition onset
                resourceQueries['Observation'] = { date: 'ge' + newStringDate };
                resourceQueries['Procedure'] = { date: 'ge' + newStringDate };
                resourceQueries['MedicationStatement'] = { effective: 'ge' + newStringDate };
              }
            }
            console.log('got Condition for MCode primary cancer condition');
          },
          (error) => {
            subscriber.error(error);
          },
          () => {
            // Once the first request is complete, it's time to move on to loading everything
            console.log('Loading:');
            console.log(resourceQueries);
            // Number of types left to load
            let remaining = 0,
              // Total over all types
              overallTotal = 0,
              // Number of types the total is not known for
              overallTotalRemaining = 0,
              // Number of records loaded (over overallTotalRemaining)
              loaded = 0,
              // Whether there are still queries left to send
              building = true;
            const entries: BundleEntry[] = [];
            const complete = () => {
              // Do nothing if still sending requests
              if (building) return;
              if (remaining <= 0) {
                // If all done, send our final event and tell the subscribers we're done
                subscriber.next(new PatientDataEvent('complete', entries.length, entries, entries.length));
                // Cache this
                this.originalPatientData = entries;
                this.patientData = deepClone(entries);
                subscriber.complete();
              }
              // Otherwise do nothing and continue to wait
            };
            for (const type in resourceQueries) {
              // Declare local loop variables here
              // flag if we have a total
              let haveTotal = false,
                // local records loaded
                localLoaded = 0;
              // Increment types remaining for both completion .
              remaining++;
              overallTotalRemaining++;
              this.fhirClient.getAllRecords(type, resourceQueries[type]).subscribe(
                (next) => {
                  const loadedEntries = next.elements.filter((record) => {
                    // Check to make sure it's a bundle entry
                    return 'fullUrl' in record && 'resource' in record;
                  }) as BundleEntry[];
                  // If we have a known total, set that
                  if (next.total && !haveTotal) {
                    haveTotal = true;
                    overallTotal += next.total;
                    overallTotalRemaining--;
                  }
                  localLoaded += next.elements.length;
                  loaded += next.elements.length;
                  entries.push(...loadedEntries);
                  // Send the event
                  subscriber.next(
                    new PatientDataEvent(
                      'progress',
                      loaded,
                      loadedEntries,
                      overallTotalRemaining <= 0 ? overallTotal : undefined
                    )
                  );
                },
                (error) => {
                  subscriber.error(error);
                },
                () => {
                  if (!haveTotal) {
                    // If we're done, we known the total now
                    haveTotal = true;
                    overallTotal += localLoaded;
                    overallTotalRemaining--;
                  }
                  remaining--;
                  complete();
                }
              );
            }
            // Indicate all queries are away and the complete event can fire
            building = false;
            // Run the complete handler to see if everything completed immediately
            complete();
          }
        );
    }));
  }

  /**
   * Remove any modifications made since the patient data was loaded. Resets back to the original patient data. If no
   * patient data is presently loaded, this does nothing.
   */
  reset() {
    if (this.originalPatientData) {
      this.patientData = deepClone(this.originalPatientData);
    }
  }

  /**
   * Sets the primary cancer condition. If no patient data is currently loaded, this will throw an Error.
   * @param primaryCondition
   *     the new primary cancer condition - this is used AS-IS in the newly created resource, meaning that any changes
   *     to the passed in object after the fact will also be reflected in the new resource
   * @return the newly created Condition resource
   */
  setPrimaryCancerCondition(primaryCondition: CodeableConcept, histologyMorphology?: CodeableConcept): Condition {
    const patientData = this.patientData;
    if (!patientData) {
      throw new Error('No patient data loaded');
    }
    // First, we need to filter out any existing primary cancer conditions
    new FhirPathFilter("Condition.meta.where(profile = '" + MCODE_PRIMARY_CANCER_CONDITION + "')").filterBundle({
      resourceType: 'Bundle',
      type: 'searchset',
      entry: patientData
    });
    const conditionResource: Condition = {
      resourceType: 'Condition',
      meta: {
        profile: [MCODE_PRIMARY_CANCER_CONDITION]
      },
      code: primaryCondition
    };
    if (histologyMorphology) {
      // Add an extension
      conditionResource.extension = [
        {
          url: MCODE_HISTOLOGY_MORPHOLOGY_BEHAVIOR,
          valueCodeableConcept: histologyMorphology
        }
      ];
    }
    // Next, we add in a new Condition record that records this condition
    patientData.push({
      resource: conditionResource
    });
    return conditionResource;
  }
}
