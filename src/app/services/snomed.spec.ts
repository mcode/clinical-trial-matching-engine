import { SnomedCodeDB, SNOMED_CODE_URI } from './snomed';

describe('SnomedCodeDB', () => {
  const db = new SnomedCodeDB({
    1: 'Example',
    100: 'Example 100'
  });
  describe('#getDisplay()', () => {
    it('returns for a code that exists', () => {
      expect(db.getDisplay('1')).toEqual('Example');
      expect(db.getDisplay(100)).toEqual('Example 100');
    });
    it('returns undefined for a code that does not exist', () => {
      expect(db.getDisplay('2')).toBeUndefined();
      expect(db.getDisplay(101)).toBeUndefined();
    });
  });
  describe('#getCodeableConcept()', () => {
    it('returns for a code that exists', () => {
      expect(db.getCodeableConcept('1')).toEqual({
        coding: [
          {
            system: SNOMED_CODE_URI,
            code: '1',
            display: 'Example'
          }
        ],
        text: 'Example'
      });
      expect(db.getCodeableConcept(100)).toEqual({
        coding: [
          {
            system: SNOMED_CODE_URI,
            code: '100',
            display: 'Example 100'
          }
        ],
        text: 'Example 100'
      });
    });
    it('returns undefined for a code that does not exist', () => {
      expect(db.getCodeableConcept('2')).toBeUndefined();
      expect(db.getCodeableConcept(101)).toBeUndefined();
    });
  });
});
