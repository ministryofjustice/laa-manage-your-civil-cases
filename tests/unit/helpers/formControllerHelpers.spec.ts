/**
 * Form Controller Helpers Tests
 *
 * Basic regression tests for form handling functionality.
 * Covers the generic form POST handler and validation system selection.
 *
 * Testing Level: Unit (Helper Functions)
 * Component: Form Controller Helpers
 * Dependencies: apiService
 */

import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import * as sinon from 'sinon';
import type { Request, Response, NextFunction } from 'express';
import { handlePostEditForm } from '#src/scripts/helpers/formControllerHelpers.js';
import { apiService } from '#src/services/apiService.js';

describe('Form Controller Helpers', () => {
  let req: Partial<Request>;
  let res: any;
  let next: any;
  let redirectStub: sinon.SinonStub;
  let apiServiceUpdateStub: sinon.SinonStub;

  // Helper function to create base form options
  const createFormOptions = (overrides = {}) => ({
    templatePath: 'test.njk',
    fields: [{ name: 'testField', value: 'testValue', existingValue: 'oldValue' }],
    apiUpdateData: { testField: 'testValue' },
    useDefaultValidator: false,
    ...overrides
  });

  beforeEach(() => {
    req = {
      params: { caseReference: 'TEST123' },
      body: { testField: 'testValue' },
      axiosMiddleware: {} as any,
      csrfToken: sinon.stub().returns('mock-csrf-token')
    };

    redirectStub = sinon.stub();
    res = {
      redirect: redirectStub
    };

    next = sinon.stub();
    apiServiceUpdateStub = sinon.stub(apiService, 'updateClientDetails');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('handlePostEditForm basic functionality', () => {
    it('should handle successful form submission with custom validation', async () => {
      // Arrange
      apiServiceUpdateStub.resolves();

      // Act
      await handlePostEditForm(req as Request, res as Response, next as NextFunction, createFormOptions());

      // Assert
      expect(redirectStub.calledOnce).to.be.true;
      expect(redirectStub.calledWith('/cases/TEST123/client-details')).to.be.true;
    });

    it('should handle successful form submission with express-validator', async () => {
      // Arrange
      apiServiceUpdateStub.resolves();

      const formOptions = createFormOptions({
        useDefaultValidator: true // Use express-validator
      });

      // Act
      await handlePostEditForm(req as Request, res as Response, next as NextFunction, formOptions);

      // Assert
      expect(redirectStub.calledOnce).to.be.true;
      expect(redirectStub.calledWith('/cases/TEST123/client-details')).to.be.true;
    });
  });
});
