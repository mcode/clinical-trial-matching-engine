import { ClinicalTrial } from 'clinical-trials-model';

export interface CqlObject {
  main: string;
  libraries: Library;
}

export interface Library {
  [name: string]: string; // should probably have an object for expected ELM structure.
}
export function getFixture(filename: string): Promise<string> {
  return fetch(`./static/cql/${filename}`).then(cql => cql.text());
}

/**
 * Function to format each block from the clinicalTrial in CQL format
 * @param cqlBlock - block of CQL code from the clinicalTrial
 * @param resourceName - Name of the CQL resource block to be defined
 * @return the CQL code formatted pretty with the define line
 */
function cqlFormat(cqlBlock: string, resourceName: string): string {
  let formattedBlock = '';

  // Definition of CQL block
  const line1 = 'define "' + resourceName + '":\n\t';

  // Build the formatted block
  formattedBlock = line1.concat(cqlBlock);
  return formattedBlock;
}

/**
 * Helper function to add the cql block to the completed cql
 * with the correct formatting
 * @param cql - complete cql string
 * @param cqlBlock - current cql block to append to the cql
 * @return the cql with the cql block appended correctly
 */
function cqlAdd(cql: string, cqlBlock: string): string {
  return cql.concat('\n', '\n', cqlBlock);
}

/**
 * Extract the CQL statements from the `criteria` section of the clinicalTrial
 * into a snippet ready to be converted to ELM.
 * @param clinicalTrial - the entire clinicalTrial object
 * @return a string of the CQL for the criteria in the clinicalTrial
 */
export function extractCriteriaCQL(clinicalTrial: ClinicalTrial): Promise<string> {
  return getFixture(clinicalTrial.library).then(library => {
    let cql = library;
    // Loop through each JSON object in the clinicalTrial
    for (const criteria of clinicalTrial.criteria) {
      const cqlBlock1 = criteria.cql;
      const nextBlock1 = cqlFormat(cqlBlock1, criteria.elementName);
      cql = cqlAdd(cql, nextBlock1);
    }

    return cql;
  });
}
