/**
 * @description Tests for the utility functions in dataTransformers work as expected
 */

import { expect } from 'chai';
import {
  safeString,
  safeOptionalString,
  isRecord,
  safeStringFromRecord,
  hasProperty,
  normaliseSelectedKeys,
  toBoolean,
  toNumber,
  toYesNo,
  formatCurrency
} from '#src/scripts/helpers/dataTransformers.js';

describe('Data Transformation Helpers', () => {

  describe('safeString()', () => {
    it('returns empty string for null or undefined', () => {
      expect(safeString(null)).to.equal('');
      expect(safeString(undefined)).to.equal('');
    });

    it('returns the string unchanged', () => {
      expect(safeString('hello')).to.equal('hello');
    });

    it('converts number and boolean to string', () => {
      expect(safeString(123)).to.equal('123');
      expect(safeString(true)).to.equal('true');
    });

    it('returns empty string for other types', () => {
      expect(safeString({})).to.equal('');
      expect(safeString([])).to.equal('');
      expect(safeString(() => {})).to.equal('');
    });
  });

  describe('safeOptionalString()', () => {
    it('returns undefined for null or undefined', () => {
      expect(safeOptionalString(null)).to.be.undefined;
      expect(safeOptionalString(undefined)).to.be.undefined;
    });

    it('returns string for string values', () => {
      expect(safeOptionalString('world')).to.equal('world');
    });

    it('converts number and boolean to string', () => {
      expect(safeOptionalString(0)).to.equal('0');
      expect(safeOptionalString(false)).to.equal('false');
    });

    it('returns undefined for other types', () => {
      expect(safeOptionalString({})).to.be.undefined;
      expect(safeOptionalString([])).to.be.undefined;
    });
  });

  describe('isRecord()', () => {
    it('returns true for plain objects', () => {
      expect(isRecord({ a: 1 })).to.be.true;
    });

    it('returns false for null, arrays, functions, and primitives', () => {
      expect(isRecord(null)).to.be.false;
      expect(isRecord([])).to.be.false;
      expect(isRecord(() => {})).to.be.false;
      expect(isRecord(123)).to.be.false;
      expect(isRecord('test')).to.be.false;
    });
  });

  describe('safeStringFromRecord()', () => {
    it('returns string value for valid key with non-empty string', () => {
      const obj = { name: 'Alice' };
      expect(safeStringFromRecord(obj, 'name')).to.equal('Alice');
    });

    it('returns null if key missing or value not a non-empty string', () => {
      const obj = { name: '' };
      expect(safeStringFromRecord(obj, 'age')).to.be.null;
      expect(safeStringFromRecord(obj, 'name')).to.be.null;
      expect(safeStringFromRecord(null, 'name')).to.be.null;
    });
  });

  describe('hasProperty()', () => {
    it('returns true if object has property', () => {
      expect(hasProperty({ foo: 123 }, 'foo')).to.be.true;
    });

    it('returns false if not a record or property missing', () => {
      expect(hasProperty(null, 'foo')).to.be.false;
      expect(hasProperty({}, 'foo')).to.be.false;
      expect(hasProperty([], 'foo')).to.be.false;
    });
  });

  describe('normaliseSelectedKeys()', () => {
    it('returns string values when input is an array', () => {
      expect(normaliseSelectedKeys(['a', 'b', 1, null])).to.deep.equal(['a', 'b']);
    });

    it('returns keys where object values are truthy', () => {
      expect(normaliseSelectedKeys({ one: true, two: false, three: 1, four: '' })).to.deep.equal(['one', 'three']);
    });

    it('returns empty array for non-array and non-object inputs', () => {
      expect(normaliseSelectedKeys(undefined)).to.deep.equal([]);
      expect(normaliseSelectedKeys('single')).to.deep.equal([]);
      expect(normaliseSelectedKeys(null)).to.deep.equal([]);
    });
  });

  describe('toBoolean()', () => {
    it('returns true for true/yes/true-like values', () => {
      expect(toBoolean(true)).to.equal(true);
      expect(toBoolean('yes')).to.equal(true);
      expect(toBoolean('YES')).to.equal(true);
      expect(toBoolean('true')).to.equal(true);
      expect(toBoolean('TrUe')).to.equal(true);
    });

    it('returns false for false/no and non-matching values', () => {
      expect(toBoolean(false)).to.equal(false);
      expect(toBoolean('no')).to.equal(false);
      expect(toBoolean('false')).to.equal(false);
      expect(toBoolean('maybe')).to.equal(false);
      expect(toBoolean(0)).to.equal(false);
      expect(toBoolean(null)).to.equal(false);
      expect(toBoolean(undefined)).to.equal(false);
    });
  });

  describe('toNumber()', () => {
    it('converts number-like values to numbers', () => {
      expect(toNumber(123)).to.equal(123);
      expect(toNumber('123')).to.equal(123);
      expect(toNumber('12.5')).to.equal(12.5);
      expect(toNumber(true)).to.equal(1);
      expect(toNumber(false)).to.equal(0);
    });

    it('returns 0 for NaN-producing values', () => {
      expect(toNumber('abc')).to.equal(0);
      expect(toNumber(undefined)).to.equal(0);
    });
  });

  describe('toYesNo()', () => {
    it('returns yes for true/yes/true-like values', () => {
      expect(toYesNo(true)).to.equal('yes');
      expect(toYesNo('yes')).to.equal('yes');
      expect(toYesNo('YES')).to.equal('yes');
      expect(toYesNo('true')).to.equal('yes');
      expect(toYesNo('TrUe')).to.equal('yes');
    });

    it('returns no for false/no/false-like values', () => {
      expect(toYesNo(false)).to.equal('no');
      expect(toYesNo('no')).to.equal('no');
      expect(toYesNo('NO')).to.equal('no');
      expect(toYesNo('false')).to.equal('no');
      expect(toYesNo('FaLsE')).to.equal('no');
    });

    it('returns empty string for non-boolean-like values', () => {
      expect(toYesNo('maybe')).to.equal('');
      expect(toYesNo(0)).to.equal('');
      expect(toYesNo(null)).to.equal('');
      expect(toYesNo(undefined)).to.equal('');
    });
  });

  describe('formatCurrency()', () => {
    it('formats integer values as currency without decimal places', () => {
      expect(formatCurrency(100)).to.equal('£100');
    });

    it('formats decimal values as currency with two decimal places', () => {
      expect(formatCurrency(1234.5)).to.equal('£1,234.50');
      expect(formatCurrency(1234.567)).to.equal('£1,234.57');
    });

    it('formats large numbers with commas', () => {
      expect(formatCurrency(1234567.89)).to.equal('£1,234,567.89');
    });
  });
});
