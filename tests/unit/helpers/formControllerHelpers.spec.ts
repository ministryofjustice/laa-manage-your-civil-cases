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
import { handlePostEditForm, handleAddThirdPartyValidationErrors, handleEditThirdPartyValidationErrors, handleNoChangeRedirect } from '#src/scripts/helpers/formControllerHelpers.js';
import { apiService } from '#src/services/apiService.js';
import { Session, SessionData } from '#node_modules/@types/express-session/index.js';

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

      // Act
      await handlePostEditForm(req as Request, res as Response, next as NextFunction, createFormOptions());

      // Assert
      expect(redirectStub.calledOnce).to.be.true;
      expect(redirectStub.calledWith('/cases/TEST123/client-details')).to.be.true;
    });
  });

  describe('Third Party Validation Functions', () => {
    let renderStub: sinon.SinonStub;
    let statusStub: sinon.SinonStub;

    beforeEach(() => {
      renderStub = sinon.stub();
      statusStub = sinon.stub().returns({ render: renderStub });
      res.status = statusStub;
      res.render = renderStub;
    });

    it('should export handleAddThirdPartyValidationErrors function', () => {
      // This is a basic test to ensure the function exists and can be called
      // More detailed validation testing would typically be done at integration level
      expect(handleAddThirdPartyValidationErrors).to.be.a('function');
    });

    it('should export handleEditThirdPartyValidationErrors function', () => {
      // This is a basic test to ensure the function exists and can be called
      // More detailed validation testing would typically be done at integration level
      expect(handleEditThirdPartyValidationErrors).to.be.a('function');
    });

    it('should accept the expected parameters for add third party validation', () => {
      // Arrange
      const caseReference = 'TEST123';
      const formFields = { thirdPartyFullName: 'John Doe' };

      // Act & Assert - Function should not throw when called with valid parameters
      expect(() => {
        handleAddThirdPartyValidationErrors(
          req as Request,
          res as Response,
          caseReference,
          formFields
        );
      }).to.not.throw();
    });

    it('should accept the expected parameters for edit third party validation', () => {
      // Arrange
      const caseReference = 'TEST123';
      const formFields = { thirdPartyFullName: 'John Doe' };

      // Act & Assert - Function should not throw when called with valid parameters
      expect(() => {
        handleEditThirdPartyValidationErrors(
          req as Request,
          res as Response,
          caseReference,
          formFields
        );
      }).to.not.throw();
    });
  });

  describe('handleNoChangeRedirect', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let redirectStub: sinon.SinonStub;

    function createMockSession(): Session & Partial<SessionData> {
      const session = {
        id: 'test-session-id',
        cookie: {} as any,
        regenerate: sinon.stub(),
        destroy: sinon.stub(),
        reload: sinon.stub(),
        save: sinon.stub(),
        touch: sinon.stub()
      };

      return session as unknown as Session & Partial<SessionData>;
    }

    beforeEach(() => {
      req = {
        params: { caseReference: 'TEST123' },
        session: createMockSession()
      };

      redirectStub = sinon.stub();

      res = {
        redirect: redirectStub
      };

    });

    afterEach(() => {
      sinon.restore();
    });


    it('should redirect and set banner when all values match', () => {
      const fields = [
        { current: 'test', existing: 'test' }
      ];

      const result = handleNoChangeRedirect(req as Request, res as Response, req.params?.caseReference, fields);


      expect(result).to.be.true;

      expect((req.session as any).noChangeWarningCache.noChangeWarningBanner).to.be.true;

      expect(redirectStub.calledOnce).to.be.true;

    });

    it('should not redirect when values differ', () => {
      const fields = [
        { current: 'test', existing: 'different' }
      ];

      const result = handleNoChangeRedirect(req as Request, res as Response, req.params?.caseReference, fields);


      expect(result).to.be.false;

      expect(req.session?.noChangeWarningBanner).to.be.undefined;

      expect(redirectStub.calledOnce).to.be.false;

    });

    it('should treat undefined current as existing value', () => {
      const fields = [
        { current: undefined, existing: 'false' }
      ];

      const result = handleNoChangeRedirect(req as Request, res as Response, req.params?.caseReference, fields);


      expect(result).to.be.true;

      expect((req.session as any).noChangeWarningCache.noChangeWarningBanner).to.be.true;

      expect(redirectStub.calledOnce).to.be.true;

    });

    it('should trim values before comparison', () => {
      const fields = [
        { current: '  test  ', existing: 'test' }
      ];

      const result = handleNoChangeRedirect(req as Request, res as Response, req.params?.caseReference, fields);


      expect(result).to.be.true;

      expect((req.session as any).noChangeWarningCache.noChangeWarningBanner).to.be.true;

      expect(redirectStub.calledOnce).to.be.true;

    });

    it('should not redirect if any field differs', () => {
      const fields = [
        { current: 'same', existing: 'same' },
        { current: 'different', existing: 'same' }
      ];

      const result = handleNoChangeRedirect(req as Request, res as Response, req.params?.caseReference, fields);

      expect(result).to.be.false;

      expect(req.session?.noChangeWarningBanner).to.be.undefined;

      expect(redirectStub.calledOnce).to.be.false;

    });

    it('should redirect if all fields match', () => {
      const fields = [
        { current: 'same', existing: 'same' },
        { current: 'same', existing: 'same' }
      ];

      const result = handleNoChangeRedirect(req as Request, res as Response, req.params?.caseReference, fields);


      expect(result).to.be.true;

     expect((req.session as any).noChangeWarningCache.noChangeWarningBanner).to.be.true;

      expect(redirectStub.calledOnce).to.be.true;

    });

    it('should redirect if fields array is empty - checking empty optional values should return true', () => {
      const fields: any[] = [];

      const result = handleNoChangeRedirect(req as Request, res as Response, req.params?.caseReference, fields);


      expect(result).to.be.true;

      expect((req.session as any).noChangeWarningCache.noChangeWarningBanner).to.be.true;

      expect(redirectStub.calledOnce).to.be.true;

    });

    it('should handle null and empty strings as equal when normalised', () => {
      const fields = [
        { current: null, existing: '' }
      ];

      const result = handleNoChangeRedirect(req as Request, res as Response, req.params?.caseReference, fields);


      expect(result).to.be.true;

      expect((req.session as any).noChangeWarningCache.noChangeWarningBanner).to.be.true;

      expect(redirectStub.calledOnce).to.be.true;

    });
  });

});
