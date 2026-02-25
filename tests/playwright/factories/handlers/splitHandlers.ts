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

  return [getProviderChoicesHandler()];
};