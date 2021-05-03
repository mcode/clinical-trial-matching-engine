#!/usr/bin/env node

// This is a small boot-strap JS script designed to run the actual filter
// scripts which are in TypeScript.

const filter = require('./out-tsc/tools/lib/filter-dir');

filter.runCLI().then(() => {
  // Do nothing on success (for now)
}, (error) => {
  console.error('Error running script:');
  console.error(error);
});
