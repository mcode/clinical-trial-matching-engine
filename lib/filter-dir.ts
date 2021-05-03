// Script to run filters over multiple JSON files

import { promises as fs } from 'fs';
import * as path from 'path';
import { debuglog } from 'util';
import FILTERS from '../src/app/filter-data/default-filters';
import { deepClone } from '../src/app/fhir-filter';
import { PatientBundle } from '../src/app/bundle';
import { isBundle } from '../src/app/fhir-types';

const debug = debuglog('filterdir');

export type JsonObject = Record<string, unknown>;
export type FilteredResults = Record<string, JsonObject>;

/**
 * Runs all filters EXCEPT the excluded filter on a deep clone of the given bundle.
 * @param bundle the bundle to run filters on
 * @return a copy of the bundle with the filters run on the copy
 */
function runFilters(bundle: PatientBundle, exclude?: string): PatientBundle {
  const result = deepClone(bundle);
  for (const filterName in FILTERS) {
    if (filterName !== exclude) {
      FILTERS[filterName].filterBundle(result);
    }
  }
  return result;
}

export function filterJSON(json: JsonObject): FilteredResults {
  // Object needs to be a PatientBundle
  if (!isBundle(json)) {
    throw new Error('Invalid JSON Object: not a patient bundle');
  }
  const bundle = json as PatientBundle;
  const result: FilteredResults = {};
  // First one is with all filters enabled
  result['none'] = runFilters(bundle);
  for (const filterName in FILTERS) {
    // Then run through with all filters EXCEPT a given filter enabled
    result[filterName] = runFilters(bundle, filterName);
  }
  return result;
}

export function filterFile(inputFile: string): Promise<FilteredResults> {
  return fs.readFile(inputFile, { encoding: 'utf8' }).then((text) => {
    const json = JSON.parse(text);
    if (typeof json === 'object') {
      return filterJSON(json);
    } else {
      throw new Error(`Expected JSON record, got ${typeof json}`);
    }
  });
}

function saveResults(results: FilteredResults, originalFile: string, outputDir: string): Promise<string[]> {
  // This is another function where we just blast out all the results.
  const promises: Promise<string>[] = [];
  for (const name in results) {
    // TODO: Allow JSON stringification options to be specified as an option
    const text = JSON.stringify(results[name], null, 2);
    const basename = path.basename(originalFile);
    const ext = path.extname(basename);
    const filename = path.join(outputDir, `${basename.substring(0, basename.length - ext.length)}.filter-${name}.json`);
    promises.push(fs.writeFile(filename, text, { encoding: 'utf8' }).then(() => filename));
  }
  return Promise.all(promises);
}

export function filterDirectory(patientDir: string, outputDir: string): Promise<Map<string, string[]>> {
  debug('Searching through %s', patientDir);
  return fs.readdir(patientDir).then((entries) => {
    // The end result is going to be a Promise per input file which should be fine - most of the work should be waiting
    // on I/O so trying to get clever with worker_threads is probably not worth the effort.
    const promises: Promise<[string, string[]]>[] = [];
    for (const entry of entries) {
      // Each entry may or may not be a valid file. For now only look at JSON
      // files.
      if (entry.length > 5 && entry.substring(entry.length - 5).toLowerCase() === '.json') {
        // Is a JSON file
        console.log('Filtering %s...', entry);
        promises.push(
          filterFile(path.join(patientDir, entry)).then((filteredBundles) => {
            return saveResults(filteredBundles, entry, outputDir).then((filteredPaths) => [entry, filteredPaths]);
          })
        );
      }
    }
    return Promise.all(promises).then((fileNames) => {
      // Convert the filenames to a map
      const result = new Map<string, string[]>();
      fileNames.forEach(([name, filteredPaths]) => {
        result.set(name, filteredPaths);
      });
      return result;
    });
  });
}

function usage(scriptName?: string, out = console.error): void {
  if (!scriptName) {
    scriptName = process.argv[0] + ' ' + process.argv[1];
  }
  out(`${scriptName} [OPTIONS] INDIR OUTDIR
Load all .json files in INDIR, and writer filtered copies to OUTDIR.`);
}

export async function runCLI(args?: string[]): Promise<void> {
  if (!args) {
    args = process.argv.slice(2);
  }
  // For now, all arguments are paths.
  let inDir: string, outDir: string;
  // For loop via index because eventually options may take args from the next
  // token. But for now there are no options.
  for (let idx = 0; idx < args.length; idx++) {
    const arg = args[idx];
    if (arg[0] === '-') {
      // An option of some type. There are no options yet.
      console.error('Unknown option %s', arg);
      usage();
      return;
    } else {
      if (inDir && outDir) {
        console.error('Too many arguments.');
        usage();
        return;
      } else if (inDir) {
        outDir = arg;
      } else {
        inDir = arg;
      }
    }
  }
  if (inDir && outDir) {
    return filterDirectory(inDir, outDir).then((results) => {
      console.log(`Filtered ${results.size} files.`);
    });
  } else {
    if (inDir) {
      console.error('Missing OUTDIR.');
    } else {
      console.error('Missing INDIR and OUTDIR.');
    }
    usage();
    return;
  }
}
