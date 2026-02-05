import { http, HttpResponse } from 'msw';
import type { MockCase } from './types.js';
import { findMockCase } from './utils.js';

export const createFeedbackHandlers = (
  apiBaseUrl: string,
  apiPrefix: string,
  cases: MockCase[]
) => {
  const getFeedbackChoicesHandler = () => {
    return http.options(
      `${apiBaseUrl}${apiPrefix}/case/:caseReference/feedback/`,
      async ({ params }) => {
        const caseReference = params.caseReference as string;
        const mockCase = findMockCase(caseReference, cases);

        if (!mockCase) {
          return new HttpResponse(null, { status: 404 });
        }

        // Return OPTIONS response with feedback choices
        return HttpResponse.json({
          name: 'Feedback',
          description: 'Submit operator feedback',
          actions: {
            POST: {
              issue: {
                type: 'choice',
                required: true,
                read_only: false,
                label: 'Issue',
                choices: [
                  { value: 'ADCO', display_name: 'Advice on call' },
                  { value: 'CB', display_name: 'Call back' },
                  { value: 'CASE', display_name: 'Case issue' },
                  { value: 'CBCO', display_name: 'Callback comms' },
                  { value: 'CACO', display_name: 'Case comms' },
                  { value: 'TECH', display_name: 'Technical issue' },
                  { value: 'OTH', display_name: 'Other' }
                ]
              },
              comment: {
                type: 'string',
                required: true,
                read_only: false,
                label: 'Comment',
                max_length: 2500
              }
            }
          }
        });
      }
    );
  };

  const submitFeedbackHandler = () => {
    return http.post(
      `${apiBaseUrl}${apiPrefix}/case/:caseReference/feedback/`,
      async ({ request, params }) => {
        const caseReference = params.caseReference as string;
        const body = await request.json() as Record<string, any>;

        // Validate required fields
        const issue = typeof body?.issue === 'string' ? body.issue.trim() : '';
        const comment = typeof body?.comment === 'string' ? body.comment.trim() : '';

        if (!issue || !comment) {
          return new HttpResponse(
            JSON.stringify({
              error: 'Missing required fields',
              details: {
                issue: !issue ? ['This field is required.'] : undefined,
                comment: !comment ? ['This field is required.'] : undefined
              }
            }),
            { status: 400 }
          );
        }

        // Validate comment length
        if (comment.length > 2500) {
          return new HttpResponse(
            JSON.stringify({
              error: 'Validation error',
              details: {
                comment: ['Ensure this field has no more than 2500 characters.']
              }
            }),
            { status: 400 }
          );
        }

        const mockCase = findMockCase(caseReference, cases);

        if (!mockCase) {
          return new HttpResponse(null, { status: 404 });
        }

        // In a real scenario, feedback would be stored
        // For MSW, we just return success
        return HttpResponse.json({
          id: Math.floor(Math.random() * 10000),
          case: caseReference,
          issue,
          comment,
          created: new Date().toISOString()
        }, { status: 201 });
      }
    );
  };

  return [
    getFeedbackChoicesHandler(),
    submitFeedbackHandler()
  ];
};
