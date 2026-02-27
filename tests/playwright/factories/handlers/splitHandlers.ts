import { http, HttpResponse } from 'msw';

export const createSplitHandlers = (
  apiBaseUrl: string,
  apiPrefix: string
) => {
  const getProviderChoicesHandler = () =>
    http.get(`${apiBaseUrl}${apiPrefix}/provider/12/`, () => {
      console.log(`[MSW] Intercepting GET ${apiPrefix}/provider/12/`);

      // Return name of Generic Provider
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
    });

  return [getProviderChoicesHandler()];
};