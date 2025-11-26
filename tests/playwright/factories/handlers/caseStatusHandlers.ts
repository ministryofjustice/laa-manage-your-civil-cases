import { http, HttpResponse } from 'msw';
import type { MockCase } from './types.js';
import { transformToApiFormat } from './utils.js';

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
        const mockCase = cases.find((c) => c.caseReference === caseReference);

        if (!mockCase) {
          return new HttpResponse(null, { status: 404 });
        }

        const updatedCase = {
          ...mockCase,
          caseStatus: 'Advising',
          provider_accepted: new Date().toISOString(),
        };

        return HttpResponse.json(transformToApiFormat(updatedCase));
      }
    );
  };

  const createCompleteCaseHandler = () => {
    return http.post(
      `${apiBaseUrl}${apiPrefix}/case/:caseReference/completed/`,
      async ({ request, params }) => {
        const caseReference = params.caseReference as string;
        const mockCase = cases.find((c) => c.caseReference === caseReference);

        if (!mockCase) {
          return new HttpResponse(null, { status: 404 });
        }

        const updatedCase = {
          ...mockCase,
          caseStatus: 'Completed',
          outcome_code: 'CLSP',
          dateClosed: new Date().toISOString(),
        };

        return HttpResponse.json(transformToApiFormat(updatedCase));
      }
    );
  };

  const createCloseCaseHandler = () => {
    return http.post(
      `${apiBaseUrl}${apiPrefix}/case/:caseReference/why-closed/`,
      async ({ request, params }) => {
        const caseReference = params.caseReference as string;
        const body = await request.json() as Record<string, any>;

        if (!body?.event_code || !body?.notes) {
          return new HttpResponse(
            JSON.stringify({ error: 'event_code and notes are required' }),
            { status: 400 }
          );
        }

        const mockCase = cases.find((c) => c.caseReference === caseReference);

        if (!mockCase) {
          return new HttpResponse(null, { status: 404 });
        }

        const updatedCase = {
          ...mockCase,
          caseStatus: 'Closed',
          provider_closed: new Date().toISOString(),
          state_note: body.notes,
          dateClosed: new Date().toISOString(),
        };

        return HttpResponse.json(transformToApiFormat(updatedCase));
      }
    );
  };

  const createPendingCaseHandler = () => {
    return http.post(
      `${apiBaseUrl}${apiPrefix}/case/:caseReference/why-pending/`,
      async ({ request, params }) => {
        const caseReference = params.caseReference as string;
        const body = await request.json() as Record<string, any>;

        if (!body?.event_code || !body?.notes) {
          return new HttpResponse(
            JSON.stringify({ error: 'event_code and notes are required' }),
            { status: 400 }
          );
        }

        const mockCase = cases.find((c) => c.caseReference === caseReference);

        if (!mockCase) {
          return new HttpResponse(null, { status: 404 });
        }

        const updatedCase = {
          ...mockCase,
          caseStatus: 'Pending',
          provider_viewed: new Date().toISOString(),
          state_note: body.notes,
        };

        return HttpResponse.json(transformToApiFormat(updatedCase));
      }
    );
  };

  const createReopenCaseHandler = () => {
    return http.post(
      `${apiBaseUrl}${apiPrefix}/case/:caseReference/why-reopen/`,
      async ({ request, params }) => {
        const caseReference = params.caseReference as string;
        const body = await request.json() as Record<string, any>;

        if (!body?.event_code || !body?.notes) {
          return new HttpResponse(
            JSON.stringify({ error: 'event_code and notes are required' }),
            { status: 400 }
          );
        }

        const mockCase = cases.find((c) => c.caseReference === caseReference);

        if (!mockCase) {
          return new HttpResponse(null, { status: 404 });
        }

        const updatedCase = {
          ...mockCase,
          caseStatus: 'Advising',
          state_note: body.notes,
          dateClosed: undefined,
        };

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
