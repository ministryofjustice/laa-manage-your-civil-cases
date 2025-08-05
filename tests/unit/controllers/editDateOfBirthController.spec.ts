/**
 * Date of Birth Controller Tests
 * 
 * Tests for the editDateOfBirthController functions.
 * Covers request handling, validation integration, and response generation.
 */

import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import type { Request, Response, NextFunction } from 'express';
import { getEditDateOfBirth, postEditDateOfBirth } from '#src/scripts/controllers/editDateOfBirthController.js';
import { apiService } from '#src/services/apiService.js';

// Mock the validationResult function by creating a global override
const mockValidationResult = {
  isEmpty: () => true,
  array: () => []
};

// Store original require/import functions
let originalValidationResult: any;

// Define the RequestWithMiddleware interface for testing
interface RequestWithMiddleware extends Request {
  axiosMiddleware: any;
  csrfToken?: () => string;
}

describe('Date of Birth Controller', () => {
  let req: Partial<RequestWithMiddleware>;
  let res: Partial<Response>;
  let next: sinon.SinonStub;
  let apiServiceStub: sinon.SinonStub;
  let renderStub: sinon.SinonStub;
  let redirectStub: sinon.SinonStub;
  let statusStub: sinon.SinonStub;

  beforeEach(() => {
    req = {
      params: { caseReference: 'TEST123' },
      body: {},
      csrfToken: () => 'test-csrf-token',
      axiosMiddleware: {} // Now properly typed
    } as Partial<RequestWithMiddleware>;

    renderStub = sinon.stub();
    redirectStub = sinon.stub();
    const sendStub = sinon.stub();
    statusStub = sinon.stub().returns({ render: renderStub, send: sendStub });

    res = {
      render: renderStub,
      redirect: redirectStub,
      status: statusStub
    };

    next = sinon.stub();
    apiServiceStub = sinon.stub(apiService, 'getRawClientDetails');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('getEditDateOfBirth', () => {
    it('should render form with existing date data', async () => {
      // Arrange
      apiServiceStub.resolves({
        status: 'success',
        data: {
          dateOfBirth: '1987-03-15'
        }
      });

      // Act
      await getEditDateOfBirth(req as RequestWithMiddleware, res as Response, next);

      // Assert
      expect(renderStub.calledOnce).to.be.true;
      expect(renderStub.calledWith('case_details/edit-date-of-birth.njk')).to.be.true;
      
      const renderArgs = renderStub.firstCall.args[1];
      expect(renderArgs.caseReference).to.equal('TEST123');
      expect(renderArgs.currentDay).to.equal('15');
      expect(renderArgs.currentMonth).to.equal('3');
      expect(renderArgs.currentYear).to.equal('1987');
    });

    it('should render form with empty fields when no existing date', async () => {
      // Arrange
      apiServiceStub.resolves({
        status: 'success',
        data: {
          dateOfBirth: ''
        }
      });

      // Act
      await getEditDateOfBirth(req as RequestWithMiddleware, res as Response, next);

      // Assert
      expect(renderStub.calledOnce).to.be.true;
      
      const renderArgs = renderStub.firstCall.args[1];
      expect(renderArgs.currentDay).to.equal('');
      expect(renderArgs.currentMonth).to.equal('');
      expect(renderArgs.currentYear).to.equal('');
    });

    it('should call next with error on API failure', async () => {
      // Arrange
      const error = new Error('API Error');
      apiServiceStub.rejects(error);

      // Act
      await getEditDateOfBirth(req as RequestWithMiddleware, res as Response, next as NextFunction);

      // Assert
      expect(next.calledOnce).to.be.true;
      expect(next.calledWith(error)).to.be.true;
    });
  });
});
