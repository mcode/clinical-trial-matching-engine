import { Injectable } from '@angular/core';
// of renamed because it's also a keyword
import { Observable, of as observableOf } from 'rxjs';

import Patient from '../patient';
import { BundleEntry } from '../fhir-types';
import { ClientService, QueryParameters, Stringable } from '../smartonfhir/client.service';

export type PatientEventType = 'progress' | 'complete';

/**
 * Notification that a chunk of patient data has been loaded. If complete, entries is all the loaded entries.
 * Otherwise, the various elements indicate the loading progress.
 */
export class PatientDataEvent {
  constructor(
    public type: PatientEventType,
    public entries?: BundleEntry[],
    public total?: number,
    public loaded?: number
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
  private patientData: BundleEntry[];
  private pendingObservable: Observable<PatientDataEvent> | null = null;
  constructor(private fhirClient: ClientService) {}

  /**
   * Clears all cache entries. Does not cancel any pending loads.
   */
  clear(): void {
    this.patient = undefined;
    this.patientData = undefined;
  }

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

  getPatientData(): Observable<PatientDataEvent> {
    if (this.patientData) {
      // If we have the patient data, immediately return it
      return observableOf(
        new PatientDataEvent('complete', this.patientData, this.patientData.length, this.patientData.length)
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
                subscriber.next(new PatientDataEvent('complete', entries, entries.length, entries.length));
                // Cache this
                this.patientData = entries;
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
                      loadedEntries,
                      overallTotalRemaining <= 0 ? overallTotal : undefined,
                      loaded
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
  // // Gathering resources for patient bundle
  // this.fhirService
  //   .getResources('Condition', {
  //     _profile: 'http://hl7.org/fhir/us/mcode/StructureDefinition/mcode-primary-cancer-condition'
  //   })
  //   .then((condition) => {
  //     const resourceTypes = ['Patient', 'Condition', 'MedicationStatement', 'Observation', 'Procedure'];
  //     const resourceParams = {
  //       Patient: {},
  //       Condition: { 'clinical-status': 'active' },
  //       MedicationStatement: {},
  //       Observation: {},
  //       Procedure: {}
  //     };
  //     if (condition.length > 0) {
  //     }
  //     const totalLoading = resourceTypes.length;
  //     let currentLoaded = 0;
  //     // Intentionally leave it indeterminite at 0, otherwise it disappears
  //     return Promise.all(
  //       resourceTypes.map((resourceType) => {
  //         return this.fhirService
  //           .getResources(resourceType, resourceParams[resourceType])
  //           .then((records) => {
  //             currentLoaded++;
  //             this.setLoadingProgress(currentLoaded, totalLoading);
  //             this.bundleResources.push(
  //               ...(records.filter((record) => {
  //                 // Check to make sure it's a bundle entry
  //                 return 'fullUrl' in record && 'resource' in record;
  //               }) as BundleEntry[])
  //             );
  //           })
  //           .catch((err) => {
  //             console.log(err);
  //             this.toastr.error(err.message, 'Error Loading Patient Data: ' + resourceType);
  //           });
  //       })
  //     ).finally(() => {
  //       // Always end
  //       this.hideLoadingOverlay();
  //     });
  //   })
  //   .catch((err) => {
  //     console.log(err);
  //     this.toastr.error(err.message, 'Error Loading Patient Data:');
  //     this.hideLoadingOverlay();
  //   });
}
