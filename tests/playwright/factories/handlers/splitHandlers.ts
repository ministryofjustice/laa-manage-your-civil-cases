import { http, HttpResponse } from 'msw';

export const createSplitHandlers = (
  apiBaseUrl: string,
  apiPrefix: string
) => {

  const getProviderChoicesHandler = () => {
    return http.get(`${apiBaseUrl}${apiPrefix}/provider/:id/`, ({ params }) => {
      const { id } = params as { id?: string };
      console.log(`[MSW] Intercepting GET ${apiPrefix}/provider/${id}/`);

      if (id === "12") {
        return HttpResponse.json({
          id: "12",
          name: "Generic Provider Public Law",
          law_category: [
            {
              code: "housing",
              name: "Housing, eviction and homelessness",
              description: ""
            },
            {
              code: "debt",
              name: "Debt, money problems and bankruptcy",
              description: ""
            }
          ]
        });
      }

      if (id === "13") {
        return HttpResponse.json({
          id: "13",
          name: "Generic Provider Public Law",
          law_category: [
            {
              code: "housing",
              name: "Housing, eviction and homelessness",
              description: ""
            }
          ]
        });
      }

      return HttpResponse.json({ detail: "Provider not found" }, { status: 404 });
    });
  };

  const submitSplitCaseHandler = () => {
    return http.post(`${apiBaseUrl}${apiPrefix}/case/:caseReference/mcc_split/`, async ({ params, request }) => {
      const { caseReference } = params;
      const body = (await request.json()) as {
        category?: string;
        internal?: boolean;
        notes?: string;
      };

      console.log(`[MSW] Intercepting POST ${apiPrefix}/case/${caseReference}/mcc_split/`);
      console.log('[MSW] Split case body:', body);

      if (!caseReference) {
        return HttpResponse.json(
          { detail: 'Case reference missing' },
          { status: 400 }
        );
      }

      if (!body.category || typeof body.internal !== 'boolean' || !body.notes) {
        return HttpResponse.json(
          { detail: 'Invalid split case payload' },
          { status: 400 }
        );
      }

      return HttpResponse.json({
        case_reference: caseReference,
        category: body.category,
        internal: body.internal,
        notes: body.notes
      });
    }
    );
  };

  return [
    getProviderChoicesHandler(),
    submitSplitCaseHandler()
  ];
};