/**
 * Search Controller Tests
 *
 * Tests the Express.js controller for search functionality.
 * Covers search request processing including:
 * - Search parameter handling (keyword and status filters)
 * - Session-based parameter persistence for pagination/sorting
 * - API integration for search data fetching
 * - Empty form rendering and search result rendering
 * - Search clearing functionality
 * - Error state management and graceful degradation
 *
 * Testing Level: Unit (Controller Layer)
 * Component: Express.js Search Route Handlers
 * Dependencies: apiService, search templates, session middleware
 */

import type { Request, Response, NextFunction } from 'express';
import * as sinon from 'sinon';
import { expect } from 'chai';
import { processSearch, clearSearch } from '#src/scripts/controllers/searchController.js';
import { apiService } from '#src/services/apiService.js';
import '#utils/server/axiosSetup.js'; // Import to get global type declarations

describe('Search Controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: sinon.SinonStub;
  let apiServiceStub: sinon.SinonStub;
  const PAGE_SIZE = 20;

  beforeEach(() => {
    req = {
      query: {},
      session: {} as any,
      axiosMiddleware: {} as any
    };
    res = {
      render: sinon.stub(),
      redirect: sinon.stub() as any,
      status: sinon.stub().returnsThis(),
      send: sinon.stub()
    };
    next = sinon.stub();

    // Stub the API service
    apiServiceStub = sinon.stub(apiService, 'searchCases');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('processSearch', () => {
    describe('empty form rendering', () => {
      it('should render empty search form when no parameters provided', async () => {
        await processSearch(req as Request, res as Response, next);

        expect((res.render as sinon.SinonStub).calledWith('search/index.njk', sinon.match({
          searchKeyword: '',
          statusSelect: 'all',
          searchPerformed: false,
          request: req
        }))).to.be.true;
        expect(apiServiceStub.called).to.be.false;
      });

      it('should render empty search form when keyword is empty and status is all', async () => {
        req.query = { searchKeyword: '', statusSelect: 'all' };

        await processSearch(req as Request, res as Response, next);

        expect((res.render as sinon.SinonStub).calledWith('search/index.njk', sinon.match({
          searchKeyword: '',
          statusSelect: 'all',
          searchPerformed: false,
          request: req
        }))).to.be.true;
        expect(apiServiceStub.called).to.be.false;
      });
    });

    describe('search execution', () => {
      it('should execute search and render results when keyword is provided', async () => {
        const mockApiResponse = {
          data: [
            { caseReference: 'TEST123', fullName: 'John Doe' },
            { caseReference: 'TEST456', fullName: 'Jane Smith' }
          ],
          pagination: { total: 2, page: 1, limit: PAGE_SIZE }
        };

        req.query = { searchKeyword: 'test', statusSelect: 'all' };
        apiServiceStub.resolves(mockApiResponse);

        await processSearch(req as Request, res as Response, next);

        expect(apiServiceStub.calledOnce).to.be.true;
        expect(apiServiceStub.calledWith(req.axiosMiddleware, {
          keyword: 'test',
          status: 'all',
          sortBy: 'modified',
          sortOrder: 'desc',
          page: 1,
          pageSize: PAGE_SIZE
        })).to.be.true;

        expect((res.render as sinon.SinonStub).calledWith('search/index.njk', sinon.match({
          searchKeyword: 'test',
          statusSelect: 'all',
          searchResults: mockApiResponse.data,
          pagination: mockApiResponse.pagination,
          searchPerformed: true,
          sortBy: 'modified',
          sortOrder: 'desc',
          request: req
        }))).to.be.true;
      });

      it('should execute search and render results when status filter is provided', async () => {
        const mockApiResponse = {
          data: [{ caseReference: 'TEST123', fullName: 'John Doe' }],
          pagination: { total: 1, page: 1, limit: PAGE_SIZE }
        };

        req.query = { searchKeyword: '', statusSelect: 'new' };
        apiServiceStub.resolves(mockApiResponse);

        await processSearch(req as Request, res as Response, next);

        expect(apiServiceStub.calledOnce).to.be.true;
        expect(apiServiceStub.calledWith(req.axiosMiddleware, {
          keyword: '',
          status: 'new',
          sortBy: 'modified',
          sortOrder: 'desc',
          page: 1,
          pageSize: PAGE_SIZE
        })).to.be.true;

        expect((res.render as sinon.SinonStub).calledWith('search/index.njk', sinon.match({
          searchKeyword: '',
          statusSelect: 'new',
          searchResults: mockApiResponse.data,
          pagination: mockApiResponse.pagination,
          searchPerformed: true,
          sortBy: 'modified',
          sortOrder: 'desc',
          request: req
        }))).to.be.true;
      });

      it('should execute search with both keyword and status filter', async () => {
        const mockApiResponse = {
          data: [{ caseReference: 'TEST123', fullName: 'John Doe' }],
          pagination: { total: 1, page: 1, limit: PAGE_SIZE }
        };

        req.query = { searchKeyword: 'john', statusSelect: 'opened' };
        apiServiceStub.resolves(mockApiResponse);

        await processSearch(req as Request, res as Response, next);

        expect(apiServiceStub.calledWith(req.axiosMiddleware, {
          keyword: 'john',
          status: 'opened',
          sortBy: 'modified',
          sortOrder: 'desc',
          page: 1,
          pageSize: PAGE_SIZE
        })).to.be.true;

        expect((res.render as sinon.SinonStub).calledWith('search/index.njk', sinon.match({
          searchKeyword: 'john',
          statusSelect: 'opened',
          searchResults: mockApiResponse.data,
          pagination: mockApiResponse.pagination,
          searchPerformed: true,
          sortBy: 'modified',
          sortOrder: 'desc',
          request: req
        }))).to.be.true;
      });
    });

    describe('pagination and sorting', () => {
      it('should handle pagination parameters correctly', async () => {
        const mockApiResponse = {
          data: [{ caseReference: 'TEST123' }],
          pagination: { total: 50, page: 3, limit: PAGE_SIZE }
        };

        req.query = {
          searchKeyword: 'test',
          statusSelect: 'all',
          sortBy: 'modified',
          sortOrder: 'desc',
          page: '3',
          pageSize: '4'
        };
        apiServiceStub.resolves(mockApiResponse);

        await processSearch(req as Request, res as Response, next);

        expect(apiServiceStub.calledWith(req.axiosMiddleware, {
          keyword: 'test',
          status: 'all',
          sortBy: 'modified',
          sortOrder: 'desc',
          page: 3,
          pageSize: PAGE_SIZE
        })).to.be.true;
      });

      it('should handle sort parameters correctly', async () => {
        const mockApiResponse = {
          data: [{ caseReference: 'TEST123' }],
          pagination: { total: 1, page: 1, limit: PAGE_SIZE }
        };

        req.query = {
          searchKeyword: 'test',
          statusSelect: 'all',
          sortBy: 'modified',
          sortOrder: 'asc',
        };
        apiServiceStub.resolves(mockApiResponse);

        await processSearch(req as Request, res as Response, next);

        expect(apiServiceStub.calledWith(req.axiosMiddleware, {
          keyword: 'test',
          status: 'all',
          sortBy: 'modified',
          sortOrder: 'asc',
          page: 1,
          pageSize: PAGE_SIZE
        })).to.be.true;

        expect((res.render as sinon.SinonStub).calledWith('search/index.njk', sinon.match({
          sortOrder: 'asc'
        }))).to.be.true;
      });

      it('should prefer sortOrder over sort parameter', async () => {
        const mockApiResponse = {
          data: [{ caseReference: 'TEST123' }],
          pagination: { total: 1, page: 1, limit: PAGE_SIZE }
        };

        req.query = {
          searchKeyword: 'test',
          statusSelect: 'all',
          sortOrder: 'desc',
          sort: 'asc'  // This should be ignored
        };
        apiServiceStub.resolves(mockApiResponse);

        await processSearch(req as Request, res as Response, next);

        expect(apiServiceStub.calledWith(req.axiosMiddleware, sinon.match({
          sortOrder: 'desc'
        }))).to.be.true;
      });
    });

    describe('session parameter persistence', () => {
      it('should store search parameters in session when provided', async () => {
        const mockApiResponse = {
          data: [{ caseReference: 'TEST123' }],
          pagination: { total: 1, page: 1, limit: PAGE_SIZE }
        };

        req.query = { searchKeyword: 'test', statusSelect: 'new' };
        req.session = {} as any;
        apiServiceStub.resolves(mockApiResponse);

        await processSearch(req as Request, res as Response, next);

        expect(req.session!['search']).to.deep.equal({ searchKeyword: 'test', statusSelect: 'new' });
      });

      it('should use session parameters when only pagination parameters are provided', async () => {
        const mockApiResponse = {
          data: [{ caseReference: 'TEST123' }],
          pagination: { total: 1, page: 2, limit: PAGE_SIZE }
        };

        req.query = { page: '2' };  // Only pagination, no search params
        req.session = {
          search: { searchKeyword: 'stored-keyword', statusSelect: 'opened' }
        } as any;
        apiServiceStub.resolves(mockApiResponse);

        await processSearch(req as Request, res as Response, next);

        expect(apiServiceStub.calledWith(req.axiosMiddleware, {
          keyword: 'stored-keyword',
          status: 'opened',
          sortBy: 'modified',
          sortOrder: 'desc',
          page: 2,
          pageSize: PAGE_SIZE
        })).to.be.true;
        
        expect((res.render as sinon.SinonStub).calledWith('search/index.njk', sinon.match({
          searchKeyword: 'stored-keyword',
          statusSelect: 'opened',
          pagination: mockApiResponse.pagination,
          searchPerformed: true,
          sortBy: 'modified',
          sortOrder: 'desc',
          request: req
        }))).to.be.true;
      });

      it('should default status to "all" when no session status exists', async () => {
        const mockApiResponse = {
          data: [{ caseReference: 'TEST123' }],
          pagination: { total: 1, page: 2, limit: PAGE_SIZE }
        };

        req.query = { page: '2' };
        req.session = {
          search: { searchKeyword: 'stored-keyword' }
          // No statusSelect in session
        } as any;
        apiServiceStub.resolves(mockApiResponse);

        await processSearch(req as Request, res as Response, next);

        expect(apiServiceStub.calledWith(req.axiosMiddleware, sinon.match({
          status: 'all'
        }))).to.be.true;
      });

      it('should not store "all" status in session when it is the default', async () => {
        const mockApiResponse = {
          data: [{ caseReference: 'TEST123' }],
          pagination: { total: 1, page: 1, limit: PAGE_SIZE }
        };

        req.query = { searchKeyword: '', statusSelect: 'all' };
        req.session = {} as any;
        apiServiceStub.resolves(mockApiResponse);

        await processSearch(req as Request, res as Response, next);

        expect(req.session!['search']).to.be.undefined;
      });
    });

    describe('default status handling', () => {
      it('should default status to "all" when no statusSelect parameter exists', async () => {
        const mockApiResponse = {
          data: [{ caseReference: 'TEST123' }],
          pagination: { total: 1, page: 1, limit: PAGE_SIZE }
        };

        req.query = { searchKeyword: 'test' };  // No statusSelect parameter
        apiServiceStub.resolves(mockApiResponse);

        await processSearch(req as Request, res as Response, next);

        expect(apiServiceStub.calledWith(req.axiosMiddleware, sinon.match({
          status: 'all'
        }))).to.be.true;
      });
    });

    describe('error handling', () => {
      it('should call next with error when API service fails', async () => {
        const apiError = new Error('API Error');
        req.query = { searchKeyword: 'test', statusSelect: 'all' };
        apiServiceStub.rejects(apiError);

        await processSearch(req as Request, res as Response, next);

        expect(next.calledWith(apiError)).to.be.true;
        expect((res.render as sinon.SinonStub).called).to.be.false;
      });
    });
  });

  describe('clearSearch', () => {
    it('should clear search parameters from session and redirect', () => {
      req.session = {
        search: { searchKeyword: 'test', statusSelect: 'new' }
      } as any;

      clearSearch(req as Request, res as Response);

      expect(req.session!['search']).to.be.undefined;
      expect((res.redirect as sinon.SinonStub).calledWith('/search')).to.be.true;
    });

    it('should handle empty session gracefully', () => {
      req.session = {} as any;

      clearSearch(req as Request, res as Response);

      expect((res.redirect as sinon.SinonStub).calledWith('/search')).to.be.true;
    });
  });
});
