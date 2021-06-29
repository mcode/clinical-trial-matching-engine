import { parseFHIRDate } from './fhir-types';

describe('parseFHIRDate()', () => {
  it('parses just a year', () => {
    expect(parseFHIRDate('2021')).toEqual(new Date(2021, 0, 1));
  });
  it('parses a year and a month', () => {
    expect(parseFHIRDate('2010-04')).toEqual(new Date(2010, 3, 1));
  });
  it('parses a full date', () => {
    expect(parseFHIRDate('1958-07-17')).toEqual(new Date(1958, 6, 17));
  });
  it('raises an error on an invalid date', () => {
    expect(() => {
      parseFHIRDate('not a date');
    }).toThrowError('Invalid date: not a date');
  });
});
