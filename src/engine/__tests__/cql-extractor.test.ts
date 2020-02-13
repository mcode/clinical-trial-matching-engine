import clinicalTrial from './fixtures/clinicaltrials/sample_clinicaltrial.json';
import { extractCriteriaCQL } from '../cql-extractor';

describe('extractCriteriaCQL', () => {
  it('extracts the criteria CQL from a pathway', () => {
    global.fetch = jest.fn(() => Promise.resolve({ text: () => 'fakeCQL' }));
    const extractedCQL = extractCriteriaCQL(clinicalTrial);
    expect(extractedCQL).resolves.toEqual(expect.stringContaining('fakeCQL'));
    expect(extractedCQL).resolves.not.toEqual(expect.stringContaining('flux-capacitor'));
    expect(extractedCQL).resolves.toEqual(
      expect.stringContaining('Malignant neoplasm of breast (disorder)')
    );
  });
});
