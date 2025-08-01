/**
 * Date of Birth Edit Workflow Integration Tests
 * 
 * Tests the complete date of birth editing workflow integration:
 * - Controller + validation + helpers working together
 * - API service integration
 * - Error handling across components
 */

import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import type { Request, Response } from 'express';
import { getEditDateOfBirth, postEditDateOfBirth } from '#src/scripts/controllers/editDateOfBirthController.js';
import { apiService } from '#src/services/apiService.js';

describe('Date of Birth Edit Workflow Integration', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: sinon.SinonStub;
  let apiServiceGetStub: sinon.SinonStub;
  let apiServiceUpdateStub: sinon.SinonStub;
  let renderStub: sinon.SinonStub;
  let redirectStub: sinon.SinonStub;
  let statusStub: sinon.SinonStub;

  beforeEach(() => {
    req = {
      params: { caseReference: 'TEST123' },
      body: {},
      axiosMiddleware: {} as any,
      csrfToken: () => 'test-csrf-token'
    };

    renderStub = sinon.stub();
    redirectStub = sinon.stub();
    statusStub = sinon.stub().returns({ render: renderStub });

    res = {
      render: renderStub,
      redirect: redirectStub,
      status: statusStub
    };

    next = sinon.stub();
    apiServiceGetStub = sinon.stub(apiService, 'getRawClientDetails');
    apiServiceUpdateStub = sinon.stub(apiService, 'updateClientDetails');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('Complete GET Workflow', () => {
    it('should integrate API fetch → date parsing → form rendering', async () => {
      // Arrange
      apiServiceGetStub.resolves({
        status: 'success',
        data: {
          dateOfBirth: '1987-03-15',
          firstName: 'John',
          lastName: 'Doe'
        },
        message: 'Success'
      });

      // Act
      await getEditDateOfBirth(req as Request, res as Response, next as any);

      // Assert - Integration of multiple components
      expect(apiServiceGetStub.calledOnce).to.be.true;
      expect(renderStub.calledOnce).to.be.true;
      
      const renderArgs = renderStub.firstCall.args[1];
      expect(renderArgs.caseReference).to.equal('TEST123');
      expect(renderArgs.currentDay).to.equal('15'); // parseIsoDateToForm integration
      expect(renderArgs.currentMonth).to.equal('3');
      expect(renderArgs.currentYear).to.equal('1987');
    });
  });

  describe('Complete POST Workflow - Success Path', () => {
    it('should integrate validation → formatting → API update → redirect', async () => {
      // Arrange
      apiServiceUpdateStub.resolves({
        status: 'success',
        data: null,
        message: 'Updated successfully'
      });

      req.body = {
        'dateOfBirth-day': '20',
        'dateOfBirth-month': '5',
        'dateOfBirth-year': '1990',
        originalDay: '15',
        originalMonth: '3',
        originalYear: '1987'
      };

      // Act
      await postEditDateOfBirth(req as Request, res as Response, next as any);

      // Assert - Integration across all components
      expect(apiServiceUpdateStub.calledOnce).to.be.true;
      expect(redirectStub.calledOnce).to.be.true;
      expect(redirectStub.calledWith('/cases/TEST123/client-details')).to.be.true;
      
      // Verify API was called with correct formatted date
      const updateCall = apiServiceUpdateStub.firstCall.args;
      expect(updateCall[1]).to.equal('TEST123');
      expect(updateCall[2]).to.deep.include({ dateOfBirth: '1990-05-20' });
    });
  });

  describe('Complete POST Workflow - Validation Error Path', () => {
    it('should integrate validation → error formatting → error rendering', async () => {
      // Arrange
      req.body = {
        'dateOfBirth-day': '',
        'dateOfBirth-month': '5',
        'dateOfBirth-year': '1990',
        originalDay: '15',
        originalMonth: '3',
        originalYear: '1987'
      };

      // Act
      await postEditDateOfBirth(req as Request, res as Response, next as any);

      // Assert - Integration of validation and error handling
      expect(statusStub.calledWith(400)).to.be.true;
      expect(renderStub.calledOnce).to.be.true;
      
      const renderArgs = renderStub.firstCall.args[1];
      expect(renderArgs.error).to.exist;
      expect(renderArgs.error.inputErrors).to.have.property('day');
      expect(renderArgs.error.errorSummaryList).to.be.an('array').with.length.greaterThan(0);
      
      // Verify error message structure for GOV.UK components
      const firstError = renderArgs.error.errorSummaryList[0];
      expect(firstError).to.have.property('text');
      expect(firstError).to.have.property('href');
    });

    it('should handle complex validation scenarios with multiple errors', async () => {
      // Arrange
      req.body = {
        'dateOfBirth-day': '32',
        'dateOfBirth-month': '13',
        'dateOfBirth-year': '90'
      };

      // Act
      await postEditDateOfBirth(req as Request, res as Response, next as any);

      // Assert
      const renderArgs = renderStub.firstCall.args[1];
      expect(renderArgs.error.inputErrors).to.have.property('day');
      expect(renderArgs.error.inputErrors).to.have.property('month');
      expect(renderArgs.error.inputErrors).to.have.property('year');
    });

    it('should integrate real date validation with error display', async () => {
      // Arrange - April 31st (impossible date)
      req.body = {
        'dateOfBirth-day': '31',
        'dateOfBirth-month': '4',
        'dateOfBirth-year': '1990',
        originalDay: '15',
        originalMonth: '3',
        originalYear: '1987'
      };

      // Act
      await postEditDateOfBirth(req as Request, res as Response, next as any);

      // Assert
      const renderArgs = renderStub.firstCall.args[1];
      expect(renderArgs.error.errorSummaryList.some((error: any) => 
        error.text.includes('real date')
      )).to.be.true;
    });

    it('should integrate no changes detection with error display', async () => {
      // Arrange
      req.body = {
        'dateOfBirth-day': '15',
        'dateOfBirth-month': '3',
        'dateOfBirth-year': '1987',
        originalDay: '15',
        originalMonth: '3',
        originalYear: '1987'
      };

      // Act
      await postEditDateOfBirth(req as Request, res as Response, next as any);

      // Assert
      const renderArgs = renderStub.firstCall.args[1];
      expect(renderArgs.error.errorSummaryList.some((error: any) => 
        error.text.includes('not changed anything')
      )).to.be.true;
    });
  });

  describe('Error Propagation Integration', () => {
    it('should properly propagate API errors through the chain', async () => {
      // Arrange
      const apiError = new Error('API Service Unavailable');
      apiServiceGetStub.rejects(apiError);

      // Act
      await getEditDateOfBirth(req as Request, res as Response, next as any);

      // Assert - Error should be passed to next middleware
      expect(next.calledOnce).to.be.true;
      expect(next.calledWith(apiError)).to.be.true;
    });

    it('should handle API update errors gracefully', async () => {
      // Arrange
      const updateError = new Error('Update Failed');
      apiServiceUpdateStub.rejects(updateError);
      
      req.body = {
        'dateOfBirth-day': '20',
        'dateOfBirth-month': '5',
        'dateOfBirth-year': '1990',
        originalDay: '15',
        originalMonth: '3',
        originalYear: '1987'
      };

      // Act
      await postEditDateOfBirth(req as Request, res as Response, next as any);

      // Assert
      expect(next.calledOnce).to.be.true;
      expect(next.calledWith(updateError)).to.be.true;
    });
  });

  describe('Data Flow Integration', () => {
    it('should preserve form data through validation errors', async () => {
      // Arrange
      req.body = {
        'dateOfBirth-day': '32',
        'dateOfBirth-month': '5',
        'dateOfBirth-year': '1990',
        originalDay: '15',
        originalMonth: '3',
        originalYear: '1987'
      };

      // Act
      await postEditDateOfBirth(req as Request, res as Response, next as any);

      // Assert - Form data should be preserved in render
      const renderArgs = renderStub.firstCall.args[1];
      expect(renderArgs.currentDay).to.equal('32');
      expect(renderArgs.currentMonth).to.equal('5');
      expect(renderArgs.currentYear).to.equal('1990');
      expect(renderArgs.originalDay).to.equal('15');
      expect(renderArgs.originalMonth).to.equal('3');
      expect(renderArgs.originalYear).to.equal('1987');
    });

    it('should include CSRF token in error responses', async () => {
      // Arrange
      req.body = {
        'dateOfBirth-day': '',
        'dateOfBirth-month': '',
        'dateOfBirth-year': ''
      };

      // Act
      await postEditDateOfBirth(req as Request, res as Response, next as any);

      // Assert
      const renderArgs = renderStub.firstCall.args[1];
      expect(renderArgs.csrfToken).to.equal('test-csrf-token');
    });
  });
});
