import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import type { Request } from 'express';
import { fetchProviderNameAndDetail } from '#src/scripts/helpers/index.js';
import { apiService } from '#src/services/apiService.js';

describe('fetchProviderNameAndDetail', () => {
  let req: Partial<Request>;
  let getProviderChoicesStub: sinon.SinonStub;

  beforeEach(() => {
    req = {
      axiosMiddleware: {},
      clientData: {}
    } as any;

    getProviderChoicesStub = sinon.stub(apiService, 'getProviderChoices');

  });

  afterEach(() => {
    sinon.restore();
  });

  it('should return provider details when API succeeds', async () => {
    req.clientData = { providerId: 'TEST123' };

    const mockResponse = {
      status: 'success',
      data: { id: 'TEST123', name: 'Test Provider' }
    };

    getProviderChoicesStub.resolves(mockResponse);

    const result = await fetchProviderNameAndDetail(req as Request, 'TEST123');

    expect(result).to.deep.equal(mockResponse.data);
    expect(getProviderChoicesStub.calledOnceWithExactly(
      req.axiosMiddleware,
      'TEST123'
    )).to.be.true;
  });


  it('should throw if providerId is missing', async () => {
    req.clientData = {};

    try {
      await fetchProviderNameAndDetail(req as Request, 'TEST123');
      throw new Error('Failed to fetch provider name');
    } catch (err: any) {
      expect(err).to.be.instanceOf(Error);
    }

    expect(getProviderChoicesStub.called).to.be.false;
  });


  it('should throw if API returns error status', async () => {
    req.clientData = { providerId: 'TEST123' };

    getProviderChoicesStub.resolves({
      status: 'error',
      data: null
    });

    try {
      await fetchProviderNameAndDetail(req as Request, 'TEST123');
      throw new Error('Failed to fetch provider name');
    } catch (err: any) {
      expect(err).to.be.instanceOf(Error);
    }

    expect(getProviderChoicesStub.calledOnce).to.be.true;
  });

  it('should throw if API returns null data', async () => {
    req.clientData = { providerId: 'TEST123' };

    getProviderChoicesStub.resolves({
      status: 'success',
      data: null
    });


    try {
      await fetchProviderNameAndDetail(req as Request, 'TEST123');
      throw new Error('Failed to fetch provider name');
    } catch (err: any) {
      expect(err).to.be.instanceOf(Error);
    }
    expect(getProviderChoicesStub.calledOnce).to.be.true;
  });
});