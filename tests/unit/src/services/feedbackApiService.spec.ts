/**
 * Unit tests for Feedback API Service
 * Tests the API integration for operator feedback functionality
 */

import { expect } from 'chai';
import sinon from 'sinon';
import { getFeedbackChoices, submitOperatorFeedback } from '#src/services/apiService.js';
import type { AxiosInstanceWrapper } from '#types/axios-instance-wrapper.js';
import type { FeedbackSubmissionRequest } from '#types/api-types.js';

describe('Feedback API Service', () => {
  let axiosMiddlewareStub: AxiosInstanceWrapper;
  let optionsStub: sinon.SinonStub;
  let postStub: sinon.SinonStub;

  beforeEach(() => {
    // Create stubs for the axios methods
    optionsStub = sinon.stub();
    postStub = sinon.stub();

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
        get: sinon.stub(),
        post: postStub,
        put: sinon.stub(),
        delete: sinon.stub(),
        patch: sinon.stub(),
        options: optionsStub
      },
      // Direct methods that AxiosInstanceWrapper should have
      get: sinon.stub(),
      post: postStub,
      put: sinon.stub(),
      delete: sinon.stub(),
      request: sinon.stub(),
      head: sinon.stub(),
      options: optionsStub,
      patch: sinon.stub(),
      use: sinon.stub()
    } as any;
  });

  afterEach(() => {
    sinon.restore();
    optionsStub?.reset();
    postStub?.reset();
  });

  describe('getFeedbackChoices', () => {
    it('should fetch feedback choices from OPTIONS endpoint and return formatted data', async () => {
      // Mock API OPTIONS response
      const mockApiResponse = {
        data: {
          name: 'Feedback List',
          actions: {
            POST: {
              issue: {
                type: 'choice',
                required: true,
                label: 'Issue',
                choices: [
                  {
                    display_name: 'Advisor conduct',
                    value: 'ADCO'
                  },
                  {
                    display_name: 'Access problems',
                    value: 'ACPR'
                  },
                  {
                    display_name: 'Already receiving/received advice',
                    value: 'ARRA'
                  },
                  {
                    display_name: 'Other',
                    value: 'OTHR'
                  }
                ]
              }
            }
          }
        }
      };

      optionsStub.resolves(mockApiResponse);

      const result = await getFeedbackChoices(axiosMiddlewareStub, 'TEST123');

      expect(result.status).to.equal('success');
      expect(result.data).to.be.an('array');
      expect(result.data).to.have.lengthOf(4);
      expect(result.data).to.not.be.null;
      expect(result.data![0]).to.deep.equal({
        display_name: 'Advisor conduct',
        value: 'ADCO'
      });
      expect(result.data![3]).to.deep.equal({
        display_name: 'Other',
        value: 'OTHR'
      });
      expect(optionsStub.calledOnce).to.be.true;
      expect(optionsStub.calledWith('/cla_provider/api/v1/case/TEST123/feedback/')).to.be.true;
    });

    it('should return empty array when no choices are available', async () => {
      // Mock API response with no choices
      const mockApiResponse = {
        data: {
          actions: {
            POST: {
              issue: {
                choices: []
              }
            }
          }
        }
      };

      optionsStub.resolves(mockApiResponse);

      const result = await getFeedbackChoices(axiosMiddlewareStub, 'TEST123');

      expect(result.status).to.equal('success');
      expect(result.data).to.be.an('array');
      expect(result.data).to.have.lengthOf(0);
    });

    it('should return empty array when response structure is missing choices', async () => {
      // Mock API response with missing structure
      const mockApiResponse = {
        data: {}
      };

      optionsStub.resolves(mockApiResponse);

      const result = await getFeedbackChoices(axiosMiddlewareStub, 'TEST123');

      expect(result.status).to.equal('success');
      expect(result.data).to.be.an('array');
      expect(result.data).to.have.lengthOf(0);
    });

    it('should handle API errors gracefully', async () => {
      optionsStub.rejects(new Error('API connection failed'));

      const result = await getFeedbackChoices(axiosMiddlewareStub, 'TEST123');

      expect(result.status).to.equal('error');
      expect(result.data).to.be.null;
      expect(result.message).to.be.a('string');
      // extractAndLogError wraps the error with a generic message
      expect(result.message).to.not.be.empty;
    });

    it('should handle network timeout errors', async () => {
      const timeoutError = new Error('timeout of 5000ms exceeded');
      optionsStub.rejects(timeoutError);

      const result = await getFeedbackChoices(axiosMiddlewareStub, 'TEST123');

      expect(result.status).to.equal('error');
      expect(result.data).to.be.null;
      // extractAndLogError wraps the error with a generic message
      expect(result.message).to.not.be.empty;
    });

    it('should handle 404 errors when case not found', async () => {
      const error = new Error('Request failed with status code 404');
      (error as any).response = { status: 404 };
      optionsStub.rejects(error);

      const result = await getFeedbackChoices(axiosMiddlewareStub, 'INVALID');

      expect(result.status).to.equal('error');
      expect(result.data).to.be.null;
    });
  });

  describe('submitOperatorFeedback', () => {
    it('should submit feedback with correct payload and return success', async () => {
      // Mock API POST response
      const mockApiResponse = {
        data: {
          id: 123,
          case: 'TEST123',
          issue: 'ADCO',
          comment: 'Excellent service provided',
          created: '2024-01-15T10:30:00Z'
        }
      };

      postStub.resolves(mockApiResponse);

      const feedbackData: FeedbackSubmissionRequest = {
        issue: 'ADCO',
        comment: 'Excellent service provided'
      };

      const result = await submitOperatorFeedback(
        axiosMiddlewareStub,
        'TEST123',
        feedbackData
      );

      expect(result.status).to.equal('success');
      expect(result.data).to.be.an('object');
      expect(result.data).to.deep.equal(mockApiResponse.data);
      expect(postStub.calledOnce).to.be.true;
      expect(postStub.calledWith('/cla_provider/api/v1/case/TEST123/feedback/', feedbackData)).to.be.true;
    });

    it('should submit feedback with maximum length comment', async () => {
      const mockApiResponse = {
        data: { id: 123 }
      };

      postStub.resolves(mockApiResponse);

      const longComment = 'a'.repeat(2500);
      const feedbackData: FeedbackSubmissionRequest = {
        issue: 'OTHR',
        comment: longComment
      };

      const result = await submitOperatorFeedback(
        axiosMiddlewareStub,
        'TEST123',
        feedbackData
      );

      expect(result.status).to.equal('success');
      expect(postStub.calledOnce).to.be.true;
      const callArgs = postStub.firstCall.args[1];
      expect(callArgs.comment).to.have.lengthOf(2500);
    });

    it('should submit feedback with empty comment', async () => {
      const mockApiResponse = {
        data: { id: 123 }
      };

      postStub.resolves(mockApiResponse);

      const feedbackData: FeedbackSubmissionRequest = {
        issue: 'ACPR',
        comment: ''
      };

      const result = await submitOperatorFeedback(
        axiosMiddlewareStub,
        'TEST123',
        feedbackData
      );

      expect(result.status).to.equal('success');
      expect(postStub.calledOnce).to.be.true;
    });

    it('should handle API validation errors', async () => {
      const validationError = new Error('Validation failed');
      (validationError as any).response = {
        status: 400,
        data: {
          issue: ['This field is required.']
        }
      };

      postStub.rejects(validationError);

      const feedbackData: FeedbackSubmissionRequest = {
        issue: '',
        comment: 'Test comment'
      };

      const result = await submitOperatorFeedback(
        axiosMiddlewareStub,
        'TEST123',
        feedbackData
      );

      expect(result.status).to.equal('error');
      expect(result.data).to.be.null;
      expect(result.message).to.be.a('string');
    });

    it('should handle API server errors gracefully', async () => {
      const serverError = new Error('Internal server error');
      (serverError as any).response = { status: 500 };
      postStub.rejects(serverError);

      const feedbackData: FeedbackSubmissionRequest = {
        issue: 'ADCO',
        comment: 'Test comment'
      };

      const result = await submitOperatorFeedback(
        axiosMiddlewareStub,
        'TEST123',
        feedbackData
      );

      expect(result.status).to.equal('error');
      expect(result.data).to.be.null;
      expect(result.message).to.include('Internal server error');
    });

    it('should handle network connection errors', async () => {
      postStub.rejects(new Error('Network Error'));

      const feedbackData: FeedbackSubmissionRequest = {
        issue: 'ADCO',
        comment: 'Test comment'
      };

      const result = await submitOperatorFeedback(
        axiosMiddlewareStub,
        'TEST123',
        feedbackData
      );

      expect(result.status).to.equal('error');
      expect(result.data).to.be.null;
      // extractAndLogError wraps the error with a generic message
      expect(result.message).to.not.be.empty;
    });

    it('should handle 403 forbidden errors', async () => {
      const forbiddenError = new Error('Forbidden');
      (forbiddenError as any).response = { status: 403 };
      postStub.rejects(forbiddenError);

      const feedbackData: FeedbackSubmissionRequest = {
        issue: 'ADCO',
        comment: 'Test comment'
      };

      const result = await submitOperatorFeedback(
        axiosMiddlewareStub,
        'TEST123',
        feedbackData
      );

      expect(result.status).to.equal('error');
      expect(result.data).to.be.null;
    });

    it('should handle 404 case not found errors', async () => {
      const notFoundError = new Error('Case not found');
      (notFoundError as any).response = { status: 404 };
      postStub.rejects(notFoundError);

      const feedbackData: FeedbackSubmissionRequest = {
        issue: 'ADCO',
        comment: 'Test comment'
      };

      const result = await submitOperatorFeedback(
        axiosMiddlewareStub,
        'INVALID123',
        feedbackData
      );

      expect(result.status).to.equal('error');
      expect(result.data).to.be.null;
    });

    it('should submit feedback with special characters in comment', async () => {
      const mockApiResponse = {
        data: { id: 123 }
      };

      postStub.resolves(mockApiResponse);

      const feedbackData: FeedbackSubmissionRequest = {
        issue: 'ADCO',
        comment: 'Comment with special chars: @#$%^&*() "quotes" and \'apostrophes\''
      };

      const result = await submitOperatorFeedback(
        axiosMiddlewareStub,
        'TEST123',
        feedbackData
      );

      expect(result.status).to.equal('success');
      expect(postStub.calledOnce).to.be.true;
    });
  });
});
