/**
 * Feedback API Service
 * Handles feedback-related API interactions
 */

import type { AxiosInstanceWrapper } from '#types/axios-instance-wrapper.js';
import type { FeedbackChoicesApiResponse, FeedbackChoice, FeedbackSubmissionRequest, FeedbackSubmissionApiResponse } from '#types/api-types.js';
import { devLog, extractAndLogError } from '#src/scripts/helpers/index.js';
import { configureAxiosInstance } from '../base/BaseApiService.js';
import { API_PREFIX, JSON_INDENT } from '../base/constants.js';

/**
 * Get feedback choices for a case
 * Calls OPTIONS endpoint to retrieve available feedback categories
 * @param {AxiosInstanceWrapper} axiosMiddleware - Axios middleware from request
 * @param {string} caseReference - Case reference number
 * @returns {Promise<FeedbackChoicesApiResponse>} API response with feedback choices
 */
export async function getFeedbackChoices(
  axiosMiddleware: AxiosInstanceWrapper,
  caseReference: string
): Promise<FeedbackChoicesApiResponse> {
  try {
    devLog(`API: OPTIONS ${API_PREFIX}/case/${caseReference}/feedback/`);

    const configuredAxios = configureAxiosInstance(axiosMiddleware);

    // Call API OPTIONS endpoint to get form schema
    const response = await configuredAxios.options(`${API_PREFIX}/case/${caseReference}/feedback/`);

    devLog(`API: Feedback choices response: ${JSON.stringify(response.data, null, JSON_INDENT)}`);

    // Extract choices from the OPTIONS response
    const choices: FeedbackChoice[] = response.data?.actions?.POST?.issue?.choices || [];

    return {
      data: choices,
      status: 'success'
    };

  } catch (error) {
    const errorMessage = extractAndLogError(error, 'API error fetching feedback choices');

    return {
      data: null,
      status: 'error',
      message: errorMessage
    };
  }
}

/**
 * Submit operator feedback for a case
 * @param {AxiosInstanceWrapper} axiosMiddleware - Axios middleware from request
 * @param {string} caseReference - Case reference number
 * @param {FeedbackSubmissionRequest} feedbackData - Feedback data to submit
 * @returns {Promise<FeedbackSubmissionApiResponse>} API response
 */
export async function submitOperatorFeedback(
  axiosMiddleware: AxiosInstanceWrapper,
  caseReference: string,
  feedbackData: FeedbackSubmissionRequest
): Promise<FeedbackSubmissionApiResponse> {
  try {
    devLog(`API: POST ${API_PREFIX}/case/${caseReference}/feedback/`);
    devLog(`Feedback data: ${JSON.stringify(feedbackData, null, JSON_INDENT)}`);

    const configuredAxios = configureAxiosInstance(axiosMiddleware);

    // Call API POST endpoint to submit feedback
    const response = await configuredAxios.post(`${API_PREFIX}/case/${caseReference}/feedback/`, feedbackData);

    devLog(`API: Feedback submission response: ${JSON.stringify(response.data, null, JSON_INDENT)}`);

    return {
      data: response.data,
      status: 'success'
    };

  } catch (error) {
    const errorMessage = extractAndLogError(error, 'API error submitting feedback');

    return {
      data: null,
      status: 'error',
      message: errorMessage
    };
  }
}
