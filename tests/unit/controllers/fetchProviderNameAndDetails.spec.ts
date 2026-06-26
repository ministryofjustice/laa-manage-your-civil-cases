
import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import * as sinon from 'sinon';
import type { Request } from 'express';

import { fetchProviderNameAndDetail, hasMoreThanOneCategory } from '#src/scripts/helpers/providerDetailHelper.js';
import { apiService } from '#src/services/apiService.js';

// Mock request type
interface MockRequest extends Partial<Request> {
  axiosMiddleware?: any;
  clientData?: any;
}

describe('Provider Helpers', () => {
  let req: MockRequest;
  let getProviderChoicesStub: sinon.SinonStub;

  beforeEach(() => {
    req = {
      axiosMiddleware: {},
      clientData: {
        providerId: 'TEST123'
      }
    };

    getProviderChoicesStub = sinon.stub(apiService, 'getProviderChoices');
  });

  afterEach(() => {
    sinon.restore();
  });

  // fetchProviderNameAndDetail

  describe('fetchProviderNameAndDetail', () => {

    it('should return provider data when API call succeeds', async () => {
      const mockProvider = {
        id: 'TEST123',
        name: 'Test Provider',
        law_category: [{ code: 'housing', name: 'Housing' }]
      };

      getProviderChoicesStub.resolves({
        status: 'success',
        data: mockProvider
      });

      const result = await fetchProviderNameAndDetail(req as Request, 'CASE123');

      expect(result).to.deep.equal(mockProvider);
      expect(getProviderChoicesStub.calledOnceWithExactly(
        req.axiosMiddleware,
        'TEST123'
      )).to.be.true;
    });

    it('should throw error if providerId is missing', async () => {
      req.clientData = {};

      try {
        await fetchProviderNameAndDetail(req as Request, 'CASE123');
        throw new Error('Expected error not thrown');
      } catch (err: any) {
       expect(err).to.be.instanceOf(Error);
      }
    });

    it('should throw error if API returns error status', async () => {
      getProviderChoicesStub.resolves({
        status: 'error',
        data: null
      });

      try {
        await fetchProviderNameAndDetail(req as Request, 'CASE123');
        throw new Error('Expected error not thrown');
      } catch (err: any) {
        expect(err).to.be.instanceOf(Error);
      }
    });

    it('should throw error if API returns null data', async () => {
      getProviderChoicesStub.resolves({
        status: 'success',
        data: null
      });

      try {
        await fetchProviderNameAndDetail(req as Request, 'CASE123');
        throw new Error('Expected error not thrown');
      } catch (err: any) {
        expect(err).to.be.instanceOf(Error);
      }
    });
  });

  // hasMoreThanOneCategory

  describe('hasMoreThanOneCategory', () => {

    it('should return true when provider has more than one category', async () => {
      getProviderChoicesStub.resolves({
        status: 'success',
        data: {
          law_category: [
            { code: 'housing', name: 'Housing' },
            { code: 'debt', name: 'Debt' }
          ]
        }
      });

      const result = await hasMoreThanOneCategory(req as Request, 'CASE123');

      expect(result).to.equal(true);
    });

    it('should return false when provider has only one category', async () => {
      getProviderChoicesStub.resolves({
        status: 'success',
        data: {
          law_category: [
            { code: 'housing', name: 'Housing' }
          ]
        }
      });

      const result = await hasMoreThanOneCategory(req as Request, 'CASE123');

      expect(result).to.equal(false);
    });

    it('should throw if fetchProviderNameAndDetail throws', async () => {
      getProviderChoicesStub.resolves({
        status: 'error',
        data: null
      });

      try {
        await hasMoreThanOneCategory(req as Request, 'CASE123');
        throw new Error('Expected error not thrown');
      } catch (err: any) {
        expect(err).to.be.instanceOf(Error);
      }
    });
  });
});
