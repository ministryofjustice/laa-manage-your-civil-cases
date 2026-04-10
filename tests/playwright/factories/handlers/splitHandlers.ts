import { NOT_FOUND } from '#src/services/api/base/constants.js';
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

      return HttpResponse.json({ detail: "Provider not found" }, { status: NOT_FOUND });
    });
  };

  const getAllCategoriesHandler = () => {
    return http.get(`${apiBaseUrl}${apiPrefix}/category/`, () => {
      console.log(`[MSW] Intercepting GET ${apiPrefix}/category/`);

      return HttpResponse.json([
        {
          code: "housing",
          name: "Housing, eviction and homelessness",
          description: "",
          ecf_available: true,
          mandatory: false
        },
        {
          code: "debt",
          name: "Debt, money problems and bankruptcy",
          description: "",
          ecf_available: true,
          mandatory: true
        },
        {
          code: "family",
          name: "Family, marriage, separation and children",
          description: "You may be able to get legal aid: ...",
          ecf_available: true,
          mandatory: false
        },
        {
          code: "immigration",
          name: "Applying for asylum or permission to stay in the UK",
          description: "",
          ecf_available: false,
          mandatory: false
        },
        {
          code: "benefits",
          name: "Welfare benefits appeals",
          description: "",
          ecf_available: false,
          mandatory: false
        },
        {
          code: "education",
          name: "Education",
          description: "",
          ecf_available: true,
          mandatory: true
        },
        {
          code: "discrimination",
          name: "Discrimination, disability and other issues",
          description: "Discrimination",
          ecf_available: true,
          mandatory: true
        },
        {
          code: "consumer",
          name: "Consumer Issues",
          description: "",
          ecf_available: true,
          mandatory: false
        },
        {
          code: "pi",
          name: "Personal Injury",
          description: "Personal Injury",
          ecf_available: false,
          mandatory: false
        },
        {
          code: "publiclaw",
          name: "Public Law",
          description: "Public Law",
          ecf_available: false,
          mandatory: false
        },
        {
          code: "commcare",
          name: "Community Care",
          description: "Community Care",
          ecf_available: false,
          mandatory: false
        },
        {
          code: "clinneg",
          name: "Clinical Negligence",
          description: "Clinical Negligence",
          ecf_available: false,
          mandatory: false
        },
        {
          code: "mentalhealth",
          name: "Mental Health",
          description: "",
          ecf_available: false,
          mandatory: false
        },
        {
          code: "aap",
          name: "Claims Against Public Authorities",
          description: "Claims Against Public Authorities",
          ecf_available: false,
          mandatory: false
        },
        {
          code: "crime",
          name: "Crime/Criminal Law",
          description: "Crime",
          ecf_available: false,
          mandatory: false
        },
        {
          code: "employment",
          name: "Employment",
          description: "Employment",
          ecf_available: true,
          mandatory: false
        },
        {
          code: "none",
          name: "None of the above",
          description: "",
          ecf_available: false,
          mandatory: false
        }
      ]);
    });
  };

  const submitSplitCaseHandler = () => {
    return http.post(`${apiBaseUrl}${apiPrefix}/case/:caseReference/mcc_split/`, async ({ params, request }) => {
      const { caseReference } = params;
      const body = (await request.json()) as {
        category: string;
        internal: boolean;
        notes: string;
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
    getAllCategoriesHandler(),
    submitSplitCaseHandler()
  ];
};