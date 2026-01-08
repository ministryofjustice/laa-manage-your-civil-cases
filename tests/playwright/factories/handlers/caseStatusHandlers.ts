import { http, HttpResponse } from 'msw';
import type { MockCase } from './types.js';
import { transformToApiFormat, findMockCase } from './utils.js';

export const createCaseStatusHandlers = (
  apiBaseUrl: string,
  apiPrefix: string,
  cases: MockCase[]
) => {
  const createAcceptCaseHandler = () => {
    return http.post(
      `${apiBaseUrl}${apiPrefix}/case/:caseReference/accept/`,
      async ({ request, params }) => {
        const caseReference = params.caseReference as string;
        const mockCase = findMockCase(caseReference, cases);

        if (!mockCase) {
          return new HttpResponse(null, { status: 404 });
        }

        mockCase.caseStatus = 'Advising';
        mockCase.lastModified = new Date().toISOString();
      

        return HttpResponse.json(transformToApiFormat(mockCase));
      }
    );
  };

  const createCompleteCaseHandler = () => {
    return http.post(
      `${apiBaseUrl}${apiPrefix}/case/:caseReference/close/`,
      async ({ params }) => {
        const caseReference = params.caseReference as string;
        const mockCase = findMockCase(caseReference, cases);

        if (!mockCase) {
          return new HttpResponse(null, { status: 404 });
        }

        mockCase.caseStatus = 'Completed';
        //mockCase.outcome_code = 'CLSP'; 
        mockCase.dateClosed = new Date().toISOString();

        return HttpResponse.json(transformToApiFormat(mockCase));
      }
    );
  };

  const createCloseCaseHandler = () => {
    return http.post(
      `${apiBaseUrl}${apiPrefix}/case/:caseReference/reject/`,
      async ({ request, params }) => {
        const caseReference = params.caseReference as string;
        const body = await request.json() as Record<string, any>;

        // Validate: event_code is required, notes is optional
        const eventCode = typeof body?.event_code === 'string' ? body.event_code.trim() : '';
        if (!eventCode) {
          return new HttpResponse(
            JSON.stringify({ error: 'Missing required field: event_code' }),
            { status: 400 }
          );
        }

        const mockCase = findMockCase(caseReference, cases);

        if (!mockCase) {
          return new HttpResponse(null, { status: 404 });
        }

        const updates = {
          caseStatus: 'Closed',
          provider_closed: new Date().toISOString(),
          state_note: body.notes || '',
          dateClosed: new Date().toISOString(),
        };

        const updatedCase = { ...mockCase, ...updates };

        return HttpResponse.json(transformToApiFormat(updatedCase));
      }
    );
  };

  const createPendingCaseHandler = () => {
    return http.post(
      `${apiBaseUrl}${apiPrefix}/case/:caseReference/open/`,
      async ({ request, params }) => {
        const caseReference = params.caseReference as string;
        const body = await request.json() as Record<string, any>;

        // Validate: notes is required, no event_code field
        const notes = typeof body?.notes === 'string' ? body.notes.trim() : '';
        if (!notes) {
          return new HttpResponse(
            JSON.stringify({ error: 'Missing required field: notes' }),
            { status: 400 }
          );
        }

        const mockCase = findMockCase(caseReference, cases);

        if (!mockCase) {
          return new HttpResponse(null, { status: 404 });
        }

        const updates = {
          caseStatus: 'Opened',
          provider_viewed: new Date().toISOString(),
          state_note: notes,
        };

        const updatedCase = { ...mockCase, ...updates };

        return HttpResponse.json(transformToApiFormat(updatedCase));
      }
    );
  };

  const createReopenCaseHandler = () => {
    return http.post(
      `${apiBaseUrl}${apiPrefix}/case/:caseReference/reopen/`,
      async ({ request, params }) => {
        const caseReference = params.caseReference as string;
        const body = await request.json() as Record<string, any>;

        // Validate: notes is required, no event_code field
        const notes = typeof body?.notes === 'string' ? body.notes.trim() : '';
        if (!notes) {
          return new HttpResponse(
            JSON.stringify({ error: 'Missing required field: notes' }),
            { status: 400 }
          );
        }

        const mockCase = findMockCase(caseReference, cases);

        if (!mockCase) {
          return new HttpResponse(null, { status: 404 });
        }

        const updates = {
          caseStatus: 'Advising',
          state_note: notes,
          dateClosed: undefined,
        };

        const updatedCase = { ...mockCase, ...updates };

        return HttpResponse.json(transformToApiFormat(updatedCase));
      }
    );
  };

  return [
    createAcceptCaseHandler(),
    createCompleteCaseHandler(),
    createCloseCaseHandler(),
    createPendingCaseHandler(),
    createReopenCaseHandler(),
  ];
};
