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

  let postStub: sinon.SinonStub;
  let patchStub: sinon.SinonStub;

  beforeEach(() => {
    // Create stubs for the axios methods
    getStub = sinon.stub();
    postStub = sinon.stub();
    patchStub = sinon.stub();

    // Create a mock axios middleware with proper structure
    axiosMiddlewareStub = {
      axiosInstance: {
        defaults: {
          baseURL: '',
          headers: {
            common: {}
          }
        },
        interceptors: {
          request: { use: sinon.stub() },
          response: { use: sinon.stub() }
        },
        get: getStub,
        post: postStub,
        put: sinon.stub(),
        delete: sinon.stub(),
        patch: patchStub
      },
      // Direct methods that AxiosInstanceWrapper should have
      get: getStub,
      post: postStub,
      put: sinon.stub(),
      delete: sinon.stub(),
      request: sinon.stub(),
      head: sinon.stub(),
      options: sinon.stub(),
      patch: patchStub,
      use: sinon.stub()
    } as any;
  });

  afterEach(() => {
    sinon.restore();
    // Reset stubs
    getStub?.reset();
    postStub?.reset();
    patchStub?.reset();
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
        pageSize: 10,
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
        pageSize: 10,
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
        pageSize: 10,
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
        sortOrder: 'asc',
        page: 2,
        pageSize: 15,
      };

      await apiService.searchCases(axiosMiddlewareStub, searchParams);

      // Verify the axios call was made with correct parameters
      expect(getStub.calledOnce).to.be.true;
      const call = getStub.getCall(0);
      expect(call.args[0]).to.equal('/cla_provider/api/v1/case/');
      expect(call.args[1].params).to.deep.equal({
        search: 'john smith',
        only: 'accepted',
        page: 2,
        page_size: 15,
        ordering: 'modified'
      });
    });
  });

  describe('Third Party Operations', () => {
    describe('addThirdPartyContact', () => {
      it('should successfully add third party contact and return transformed data', async () => {
        // Mock API response - must include client's personal_details at top level
        const mockApiResponse = {
          data: {
            reference: 'TEST123',
            full_name: 'John Doe',
            date_of_birth: '1990-01-01',
            state: 'OPEN',
            laa_reference: 'LAA-123',
            provider_assigned_at: '2024-01-01T10:00:00Z',
            personal_details: {
              full_name: 'John Doe',
              date_of_birth: '1990-01-01',
              home_phone: '01234567890',
              mobile_phone: '07700900000'
            },
            thirdparty_details: {
              personal_details: {
                full_name: 'Jane Smith',
                mobile_phone: '07700900123',
                email: 'jane@example.com',
                safe_to_contact: 'SAFE'
              },
              personal_relationship: 'PARENT_GUARDIAN',
              pass_phrase: 'secret'
            }
          }
        };

        postStub.resolves(mockApiResponse);
        
        const thirdPartyData = {
          personal_details: {
            full_name: 'Jane Smith',
            mobile_phone: '07700900123',
            email: 'jane@example.com',
            safe_to_contact: 'SAFE'
          },
          personal_relationship: 'PARENT_GUARDIAN',
          pass_phrase: 'secret'
        };

        const result = await apiService.addThirdPartyContact(
          axiosMiddlewareStub,
          'TEST123',
          thirdPartyData
        );

        expect(result.status).to.equal('success');
        expect(result.data).to.be.an('object');
        expect(postStub.calledOnce).to.be.true;
        expect(postStub.calledWith('/cla_provider/api/v1/case/TEST123/thirdparty_details/', thirdPartyData)).to.be.true;
      });

      it('should handle API errors gracefully', async () => {
        postStub.rejects(new Error('API connection failed'));

        const thirdPartyData = {
          personal_details: {
            full_name: 'Jane Smith'
          }
        };

        const result = await apiService.addThirdPartyContact(
          axiosMiddlewareStub,
          'TEST123',
          thirdPartyData
        );

        expect(result.status).to.equal('error');
        expect(result.data).to.be.null;
        expect(result.message).to.include('An unexpected error occurred');
      });
    });

    describe('updateThirdPartyContact', () => {
      it('should successfully update third party contact and return transformed data', async () => {
        // Mock API response - must include client's personal_details at top level
        const mockApiResponse = {
          data: {
            reference: 'TEST123',
            full_name: 'John Doe',
            date_of_birth: '1990-01-01',
            state: 'OPEN',
            laa_reference: 'LAA-123',
            provider_assigned_at: '2024-01-01T10:00:00Z',
            personal_details: {
              full_name: 'John Doe',
              date_of_birth: '1990-01-01',
              home_phone: '01234567890',
              mobile_phone: '07700900000'
            },
            thirdparty_details: {
              personal_details: {
                full_name: 'Jane Smith Updated',
                mobile_phone: '07700900456',
                email: 'jane.updated@example.com',
                safe_to_contact: 'SAFE'
              },
              personal_relationship: 'PARENT_GUARDIAN'
            }
          }
        };

        patchStub.resolves(mockApiResponse);

        const updateData = {
          personal_details: {
            full_name: 'Jane Smith Updated',
            mobile_phone: '07700900456',
            email: 'jane.updated@example.com',
            safe_to_contact: 'SAFE'
          },
          personal_relationship: 'PARENT_GUARDIAN'
        };

        const result = await apiService.updateThirdPartyContact(
          axiosMiddlewareStub,
          'TEST123',
          updateData
        );

        expect(result.status).to.equal('success');
        expect(result.data).to.be.an('object');
        expect(patchStub.calledOnce).to.be.true;
        expect(patchStub.calledWith('/cla_provider/api/v1/case/TEST123/thirdparty_details/', updateData)).to.be.true;
      });

      it('should handle API errors gracefully', async () => {
        patchStub.rejects(new Error('API connection failed'));

        const updateData = {
          personal_details: {
            full_name: 'Jane Smith'
          }
        };

        const result = await apiService.updateThirdPartyContact(
          axiosMiddlewareStub,
          'TEST123',
          updateData
        );

        expect(result.status).to.equal('error');
        expect(result.data).to.be.null;
        expect(result.message).to.include('An unexpected error occurred');
      });
    });

    describe('deleteThirdPartyContact', () => {
      it('should successfully soft delete third party contact with correct payload', async () => {
        // Mock API responses for both PATCH and GET
        const mockPatchResponse = {
          data: {
            reference: 'TEST123',
            full_name: 'John Doe'
          }
        };

        const mockGetResponse = {
          data: {
            reference: 'TEST123',
            full_name: 'John Doe',
            date_of_birth: '1990-01-01',
            state: 'OPEN',
            laa_reference: 'LAA-123',
            provider_assigned_at: '2024-01-01T10:00:00Z',
            personal_details: {
              full_name: 'John Doe',
              date_of_birth: '1990-01-01',
              home_phone: '01234567890',
              mobile_phone: '07700900000'
            },
            thirdparty_details: null
          }
        };

        patchStub.resolves(mockPatchResponse);
        getStub.resolves(mockGetResponse);

        const result = await apiService.deleteThirdPartyContact(
          axiosMiddlewareStub,
          'TEST123'
        );

        expect(result.status).to.equal('success');
        expect(result.data).to.be.an('object');

        // Verify PATCH was called with correct endpoint and soft-delete payload
        expect(patchStub.calledOnce).to.be.true;
        const patchCall = patchStub.getCall(0);
        expect(patchCall.args[0]).to.equal('/cla_provider/api/v1/case/TEST123/thirdparty_details/');
        
        // Verify the exact soft-delete payload structure
        const payload = patchCall.args[1];
        expect(payload).to.deep.equal({
          personal_details: {
            title: null,
            full_name: null,
            postcode: null,
            street: null,
            mobile_phone: null,
            home_phone: '',
            email: '',
            safe_to_contact: null
          },
          pass_phrase: null,
          reason: null,
          personal_relationship: 'OTHER',
          personal_relationship_note: '',
          spoke_to: null,
          no_contact_reason: null,
          organisation_name: null
        });

        // Verify GET was called to re-fetch case data
        expect(getStub.calledOnce).to.be.true;
        expect(getStub.calledWith('/cla_provider/api/v1/case/TEST123/detailed')).to.be.true;
      });

      it('should handle API errors gracefully', async () => {
        patchStub.rejects(new Error('API connection failed'));

        const result = await apiService.deleteThirdPartyContact(
          axiosMiddlewareStub,
          'TEST123'
        );

        expect(result.status).to.equal('error');
        expect(result.data).to.be.null;
        expect(result.message).to.include('An unexpected error occurred');
      });
    });
  });
});