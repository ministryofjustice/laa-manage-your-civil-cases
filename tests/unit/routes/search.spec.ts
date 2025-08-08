/**
 * Search Routes Tests
 *
 * Tests the Express.js router configuration and HTTP endpoints for search functionality.
 * Uses supertest for HTTP endpoint testing without complex router introspection.
 *
 * Testing Level: Integration (HTTP Routes)
 * Component: Express.js Router with HTTP requests
 * Dependencies: searchController functions
 */

import request from 'supertest';
import express from 'express';
import * as sinon from 'sinon';
import { expect } from 'chai';
import searchRouter from '#routes/search.js';

describe('Search Routes', () => {
  let app: express.Application;
  let processSearchStub: sinon.SinonStub;
  let clearSearchStub: sinon.SinonStub;

  beforeEach(() => {
    // Create Express app
    app = express();

    // Add minimal middleware (required by search routes)
    app.use((req, res, next) => {
      req.session = {} as any;
      req.axiosMiddleware = {} as any;
      next();
    });

    // Create stubs for controller functions
    processSearchStub = sinon.stub().callsFake((req, res) => {
      res.status(200).json({ message: 'Search processed' });
    });

    clearSearchStub = sinon.stub().callsFake((req, res) => {
      res.status(200).json({ message: 'Search cleared' });
    });

    // Replace the actual controller functions in the router
    const routerStack = (searchRouter as any).stack;

    const rootRoute = routerStack.find((layer: any) => {
      return layer.route && layer.route.path === '/';
    });
    if (rootRoute) {
      rootRoute.route.stack[0].handle = processSearchStub;
    }

    const clearRoute = routerStack.find((layer: any) => {
      return layer.route && layer.route.path === '/clear';
    });
    if (clearRoute) {
      clearRoute.route.stack[0].handle = clearSearchStub;
    }

    // Mount the router
    app.use('/search', searchRouter);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('GET /search', () => {
    it('should return 200 status', async () => {
      const response = await request(app)
        .get('/search')
        .expect(200);

      expect(response.body).to.deep.equal({ message: 'Search processed' });
      expect(processSearchStub.calledOnce).to.be.true;
    });

    it('should call processSearch controller function', async () => {
      await request(app).get('/search');

      expect(processSearchStub.calledOnce).to.be.true;
      expect(clearSearchStub.called).to.be.false;
    });

    it('should handle query parameters', async () => {
      await request(app)
        .get('/search?searchKeyword=test&statusSelect=all')
        .expect(200);

      expect(processSearchStub.calledOnce).to.be.true;

      // Verify the request object has the query parameters
      const req = processSearchStub.firstCall.args[0];
      expect(req.query).to.have.property('searchKeyword', 'test');
      expect(req.query).to.have.property('statusSelect', 'all');
    });
  });

  describe('GET /search/clear', () => {
    it('should return 200 status', async () => {
      const response = await request(app)
        .get('/search/clear')
        .expect(200);

      expect(response.body).to.deep.equal({ message: 'Search cleared' });
      expect(clearSearchStub.calledOnce).to.be.true;
    });

    it('should call clearSearch controller function', async () => {
      await request(app).get('/search/clear');

      expect(clearSearchStub.calledOnce).to.be.true;
      expect(processSearchStub.called).to.be.false;
    });
  });

});