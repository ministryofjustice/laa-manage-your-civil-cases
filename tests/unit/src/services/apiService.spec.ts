/**
 * Unit tests for ApiService
 */

import { expect } from 'chai';
import sinon from 'sinon';
import { apiService } from '#src/services/apiService.js';
import type { AxiosInstanceWrapper } from '#types/axios-instance-wrapper.js';
import type { SearchApiParams } from '#types/api-types.js';

describe('ApiService', () => {
  let axiosMiddlewareStub: AxiosInstanceWrapper;
  let getStub: sinon.SinonStub;

  beforeEach(() => {
    // Create a stub for the axios get method
    getStub = sinon.stub();

    // Create a mock axios middleware with proper structure
    axiosMiddlewareStub = {
      axiosInstance: {
        defaults: {
          headers: {
            common: {}
          }
        },
        interceptors: {
          request: { use: sinon.stub() },
          response: { use: sinon.stub() }
        },
        get: getStub,
        post: sinon.stub(),
        put: sinon.stub(),
        delete: sinon.stub()
      },
      // Direct methods that AxiosInstanceWrapper should have
      get: getStub,
      post: sinon.stub(),
      put: sinon.stub(),
      delete: sinon.stub(),
      request: sinon.stub(),
      head: sinon.stub(),
      options: sinon.stub(),
      patch: sinon.stub(),
      use: sinon.stub()
    } as any;
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('searchCases', () => {
    it('should search cases with keyword and return formatted results', async () => {
      // Mock CLA API response
      const mockApiResponse = {
        data: {
          results: [
            {
              reference: 'PC-2024-0001',
              full_name: 'John Smith',
              modified: '2024-01-15',
              requires_action_by: 'provider'
            },
            {
              reference: 'PC-2024-0002',
              full_name: 'Jane Doe',
              modified: '2024-01-10',
              requires_action_by: 'provider'
            }
          ],
          count: 2
        }
      };

      getStub.resolves(mockApiResponse);

      const searchParams: SearchApiParams = {
        keyword: 'John',
        status: 'all',
        page: 1,
        limit: 10,
        sortOrder: 'desc'
      };

      const result = await apiService.searchCases(axiosMiddlewareStub, searchParams);

      expect(result.status).to.equal('success');
      expect(result.data).to.be.an('array');
      expect(result.data).to.have.lengthOf(2);
      expect(result.data[0].caseReference).to.equal('PC-2024-0001');
      expect(result.data[0].fullName).to.equal('John Smith');
      expect(result.pagination).to.be.an('object');
      expect(result.pagination.total).to.equal(2);
    });

    it('should handle empty search results', async () => {
      const mockApiResponse = {
        data: {
          results: [],
          count: 0
        }
      };

      getStub.resolves(mockApiResponse);

      const searchParams: SearchApiParams = {
        keyword: 'nonexistent',
        status: 'all',
        page: 1,
        limit: 10,
        sortOrder: 'desc'
      };

      const result = await apiService.searchCases(axiosMiddlewareStub, searchParams);

      expect(result.status).to.equal('success');
      expect(result.data).to.be.an('array');
      expect(result.data).to.have.lengthOf(0);
      expect(result.pagination.total).to.equal(0);
    });

    it('should handle API errors gracefully', async () => {
      getStub.rejects(new Error('API connection failed'));

      const searchParams: SearchApiParams = {
        keyword: 'test',
        status: 'all',
        page: 1,
        limit: 10,
        sortOrder: 'desc'
      };

      try {
        await apiService.searchCases(axiosMiddlewareStub, searchParams);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.an('error');
        expect((error as Error).message).to.include('An unexpected error occurred');
      }
    });

    it('should call CLA API with correct parameters', async () => {
      const mockApiResponse = {
        data: {
          results: [],
          count: 0
        }
      };

      getStub.resolves(mockApiResponse);

      const searchParams: SearchApiParams = {
        keyword: 'john smith',
        status: 'accepted',
        page: 2,
        limit: 15,
        sortOrder: 'asc'
      };

      await apiService.searchCases(axiosMiddlewareStub, searchParams);

      // Verify the axios call was made with correct parameters
      expect(getStub.calledOnce).to.be.true;
      const call = getStub.getCall(0);
      expect(call.args[0]).to.equal('/cla_provider/api/v1/case/');
      expect(call.args[1].params).to.deep.equal({
        search: 'john smith',
        only: 'accepted'
      });
    });
  });
});