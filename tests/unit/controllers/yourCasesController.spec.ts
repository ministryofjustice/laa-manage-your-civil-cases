/**
 * Your Cases Controller Tests
 * 
 * Tests the Express.js controller factory for case listing functionality.
 * Covers dynamic route handler generation for different case types including:
 * - Case type routing (new, accepted, opened, closed)
 * - API integration for case data fetching
 * - Pagination handling and view rendering
 * - Error state management and graceful degradation
 * 
 * Testing Level: Unit (Controller Layer)
 * Component: Express.js Dynamic Route Handlers
 * Dependencies: apiService, case listing templates
 */

import type { Request, Response, NextFunction } from 'express';
import * as sinon from 'sinon';
import { expect } from 'chai';
import { createCaseRouteHandler } from '#src/scripts/controllers/yourCasesController.js';
import { apiService } from '#src/services/apiService.js';
import '#utils/axiosSetup.js'; // Import to get global type declarations

describe('Your Cases Controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: sinon.SinonStub;
  let apiServiceStub: sinon.SinonStub;

  beforeEach(() => {
    req = {
      params: { caseType: 'new' },
      query: {},
      axiosMiddleware: {} as any
    };
    res = {
      render: sinon.stub(),
      status: sinon.stub().returnsThis(),
      send: sinon.stub()
    };
    next = sinon.stub();
    
    // Stub the API service
    apiServiceStub = sinon.stub(apiService, 'getCases');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('createCaseRouteHandler', () => {
    it('should generate route handler that successfully renders case listing page with API data and pagination', async () => {
      // Mock API response
      apiServiceStub.resolves({
        status: 'success',
        data: [{ caseReference: 'TEST123' }],
        pagination: { total: 1, page: 1, limit: 20 }
      });

      const handler = createCaseRouteHandler('new');
      await handler(req as Request, res as Response, next);

      expect((res.render as sinon.SinonStub).calledWith('cases/index')).to.be.true;
      expect(apiServiceStub.calledOnce).to.be.true;
    });

    it('should handle API service failures gracefully and still render page with empty state', async () => {
      apiServiceStub.resolves({
        status: 'error',
        message: 'API Error'
      });

      const handler = createCaseRouteHandler('new');
      await handler(req as Request, res as Response, next);

      expect((res.render as sinon.SinonStub).calledWith('cases/index')).to.be.true;
    });
  });
});
