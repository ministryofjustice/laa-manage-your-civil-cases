/**
 * @description Tests for the utility function formatDate works as expected
 */

import { expect } from 'chai';
import { formatDate, formatDateLongMonth, formatLongFormDate, formatLongFormDateWithShortMonth, dateStringFromThreeFields } from '#src/scripts/helpers/dateFormatter.js';

describe('formatDate()', () => {
  it('formats a valid ISO date string correctly', () => {
    expect(formatDate('1986-01-06T00:00:00Z')).to.equal('6 Jan 1986');
    expect(formatDate('2023-07-28')).to.equal('28 Jul 2023');
  });

  it('formats dates with single-digit days without leading zero', () => {
    expect(formatDate('2023-02-05')).to.equal('5 Feb 2023');
  });

    it('handles invalid date strings by returning the original input', () => {
    expect(formatDate('invalid-date')).to.equal('invalid-date');
    expect(formatDate('')).to.equal('');
  });
});

describe('formatDateLongMonth()', () => {
  it('formats a valid ISO date string correctly', () => {
    expect(formatDateLongMonth('1986-01-06T00:00:00Z')).to.equal('6 January 1986');
    expect(formatDateLongMonth('2023-07-28')).to.equal('28 July 2023');
  });

  it('formats dates with single-digit days without leading zero', () => {
    expect(formatDateLongMonth('2023-02-05')).to.equal('5 February 2023');
  });

    it('handles invalid date strings by returning the original input', () => {
    expect(formatDateLongMonth('invalid-date')).to.equal('invalid-date');
    expect(formatDateLongMonth('')).to.equal('');
  });
});

describe('formatLongFormDate()', () => {
  it('formats a valid ISO date string correctly', () => {
    expect(formatLongFormDate('1986-01-06T14:01:00')).to.equal('6 January 1986 at 2:01pm');
  });

  it('formats morning times using am', () => {
    expect(formatLongFormDate('2023-07-28T09:05:00')).to.equal('28 July 2023 at 9:05am');
  });

  it('pads minutes with a leading zero when needed', () => {
    expect(formatLongFormDate('2023-07-28T14:05:00')).to.equal('28 July 2023 at 2:05pm');
  });

  it('handles midnight correctly', () => {
    expect(formatLongFormDate('2023-07-28T00:00:00')).to.equal('28 July 2023 at 12:00am');
  });

  it('handles noon correctly', () => {
    expect(formatLongFormDate('2023-07-28T12:00:00')).to.equal('28 July 2023 at 12:00pm');
  });

  it('handles invalid date strings by returning the original input', () => {
    expect(formatLongFormDate('invalid-date')).to.equal('invalid-date');
    expect(formatLongFormDate('')).to.equal('');
  });
});

describe('formatLongFormDateWithShortMonth()', () => {
  it('formats a valid ISO date string correctly', () => {
    expect(formatLongFormDateWithShortMonth('1986-01-06T14:01:00')).to.equal('6 Jan 1986 at 2:01pm');
  });

  it('formats morning times using am', () => {
    expect(formatLongFormDateWithShortMonth('2023-07-28T09:05:00')).to.equal('28 Jul 2023 at 9:05am');
  });

  it('pads minutes with a leading zero when needed', () => {
    expect(formatLongFormDateWithShortMonth('2023-07-28T14:05:00')).to.equal('28 Jul 2023 at 2:05pm');
  });

  it('handles midnight correctly', () => {
    expect(formatLongFormDateWithShortMonth('2023-07-28T00:00:00')).to.equal('28 Jul 2023 at 12:00am');
  });

  it('handles noon correctly', () => {
    expect(formatLongFormDateWithShortMonth('2023-07-28T12:00:00')).to.equal('28 Jul 2023 at 12:00pm');
  });

  it('handles invalid date strings by returning the original input', () => {
    expect(formatLongFormDateWithShortMonth('invalid-date')).to.equal('invalid-date');
    expect(formatLongFormDateWithShortMonth('')).to.equal('');
  });
});

describe('dateStringFromThreeFields()', () => {
  it('constructs a valid date string in YYYY-MM-DD format', () => {
    expect(dateStringFromThreeFields('6', '1', '1986')).to.equal('1986-01-06');
    expect(dateStringFromThreeFields('28', '7', '2023')).to.equal('2023-07-28');
  });

  it('pads single-digit day and month values with a leading zero', () => {
    expect(dateStringFromThreeFields('5', '2', '2023')).to.equal('2023-02-05');
    expect(dateStringFromThreeFields('1', '9', '2024')).to.equal('2024-09-01');
  });

  it('keeps already padded day and month values unchanged', () => {
    expect(dateStringFromThreeFields('09', '11', '2024')).to.equal('2024-11-09');
  });

  it('handles empty values by returning a partially constructed date string', () => {
    expect(dateStringFromThreeFields('', '', '2024')).to.equal('2024-00-00');
  });
});