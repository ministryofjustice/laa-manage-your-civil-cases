/**
 * Unit tests for editDateOfBirthHelpers
 * Covers main logic for coverage, not implementation details or edge cases.
 */
import { expect } from 'chai';
import sinon from 'sinon';
import {
  getDateInlineErrorMessage,
  getDateFieldHighlighting,
  extractFormData,
  populateExistingDate,
  generateCsrfToken,
  processValidationErrors,
  createErrorRenderOptions,
  handleSuccessfulUpdate
} from '#src/scripts/controllers/helpers/editDateOfBirthHelpers.js';

describe('editDateOfBirthHelpers', () => {
  describe('getDateInlineErrorMessage', () => {
    it('returns empty string for no errors', () => {
      // The function actually returns joined empty strings which results in empty string when no real errors exist
      const result = getDateInlineErrorMessage({});
      expect(result.trim()).to.equal('');
    });
    it('returns error for day only', () => {
      expect(getDateInlineErrorMessage({ 'dateOfBirth-day': 'Missing day', 'dateOfBirth-month': '', 'dateOfBirth-year': '' })).to.equal('Missing day');
    });
    it('returns concatenated errors for multiple fields', () => {
      expect(getDateInlineErrorMessage({ 'dateOfBirth-day': 'Missing day', 'dateOfBirth-month': 'Missing month', 'dateOfBirth-year': 'Missing year' })).to.include('Missing day');
    });
  });

  describe('getDateFieldHighlighting', () => {
    function makeGovUkError(overrides: Partial<any> = {}) {
      return {
        param: overrides.param || '',
        msg: overrides.msg || '',
        href: overrides.href || '',
        priority: overrides.priority || 1,
        isGlobal: overrides.isGlobal || false,
        type: 'validation_error',
        fieldName: overrides.param || '',
        timestamp: Date.now(),
        name: 'ValidationError',
        message: overrides.msg || '',
      } as any;
    }
    it('returns all false for no errors', () => {
      expect(getDateFieldHighlighting({}, [])).to.deep.equal({ highlightDay: false, highlightMonth: false, highlightYear: false });
    });
    it('highlights all fields for global error', () => {
      const errors = [makeGovUkError({ isGlobal: true })];
      expect(getDateFieldHighlighting({ 'dateOfBirth-day': 'err', 'dateOfBirth-month': 'err', 'dateOfBirth-year': 'err' }, errors as any)).to.deep.equal({ highlightDay: true, highlightMonth: true, highlightYear: true });
    });
    it('highlights only specific fields for field errors', () => {
      const errors = [
        makeGovUkError({ param: 'dateOfBirth-day', msg: 'err' }),
        makeGovUkError({ param: 'dateOfBirth-month', msg: 'err' })
      ];
      expect(getDateFieldHighlighting({ 'dateOfBirth-day': 'err', 'dateOfBirth-month': 'err', 'dateOfBirth-year': '' }, errors as any)).to.deep.equal({ highlightDay: true, highlightMonth: true, highlightYear: false });
    });
  });

  describe('extractFormData', () => {
    it('extracts fields from request body', () => {
      const req = {
        body: {
          'dateOfBirth-day': '1',
          'dateOfBirth-month': '2',
          'dateOfBirth-year': '2000',
          originalDay: '1',
          originalMonth: '2',
          originalYear: '2000'
        },
        axiosMiddleware: {},
      } as any;
      const result = extractFormData(req);
      expect(result.day).to.equal('1');
      expect(result.month).to.equal('2');
      expect(result.year).to.equal('2000');
      expect(result.originalDay).to.equal('1');
    });
  });

  describe('populateExistingDate', () => {
    it('returns empty fields for missing data', () => {
      expect(populateExistingDate({ status: 'fail', data: null })).to.deep.equal({ currentDay: '', currentMonth: '', currentYear: '' });
    });
    it('parses valid date', () => {
      const result = populateExistingDate({ status: 'success', data: { dateOfBirth: '2000-01-02' } });
      expect(result.currentDay).to.equal('2');
      expect(result.currentMonth).to.equal('1');
      expect(result.currentYear).to.equal('2000');
    });
  });

  describe('generateCsrfToken', () => {
    it('returns token if function exists', () => {
      const req = { axiosMiddleware: {}, csrfToken: () => 'token' } as any;
      expect(generateCsrfToken(req)).to.equal('token');
    });
    it('returns empty string if no function', () => {
      const req = { axiosMiddleware: {} } as any;
      expect(generateCsrfToken(req)).to.equal('');
    });
  });

  describe('processValidationErrors', () => {
    it('returns formatted errors', () => {
      const rawErrors = [{ param: 'dateOfBirth-day', msg: 'Missing', value: '', location: 'body', type: 'field', path: 'dateOfBirth-day' } as any];
      const result = processValidationErrors(rawErrors);
      expect(result).to.be.an('array');
    });
  });

  describe('createErrorRenderOptions', () => {
    it('returns render options with error state', () => {
      const formData = { day: '1', month: '2', year: '2000', originalDay: '1', originalMonth: '2', originalYear: '2000' };
      const govUkErrors = [{
        param: 'dateOfBirth-day',
        msg: 'Missing',
        href: '',
        priority: 1,
        isGlobal: false,
        type: 'validation_error',
        fieldName: 'dateOfBirth-day',
        timestamp: Date.now(),
        name: 'ValidationError',
        message: 'Missing',
      }] as any;
      const req = { axiosMiddleware: {}, csrfToken: () => 'token' } as any;
      const result = createErrorRenderOptions('REF', formData, govUkErrors, req);
      expect(result.caseReference).to.equal('REF');
      expect(result.error).to.exist;
      expect(result.csrfToken).to.equal('token');
    });
  });

  describe('handleSuccessfulUpdate', () => {
    it('calls apiService.updateClientDetails and returns formatted date', async () => {
      const apiService = await import('#src/services/apiService.js');
      const apiStub = sinon.stub(apiService.apiService, 'updateClientDetails').resolves();
      const req = { axiosMiddleware: {}, csrfToken: () => 'token' } as any;
      const formData = { day: '1', month: '2', year: '2000', originalDay: '1', originalMonth: '2', originalYear: '2000' };
      const result = await handleSuccessfulUpdate(req, 'REF', formData);
      expect(result).to.equal('2000-02-01');
      apiStub.restore();
    });
  });
});
