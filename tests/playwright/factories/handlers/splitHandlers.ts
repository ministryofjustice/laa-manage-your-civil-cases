import { http, HttpResponse } from 'msw';
import type { MockCase } from './types.js';

export const createSplitHandlers = (
  apiBaseUrl: string,
  apiPrefix: string,
  cases: MockCase[]
) => {
  const getProviderChoicesHandler = () =>
    http.get(`${apiBaseUrl}${apiPrefix}/provider/:providerId/`, ({ params }) => {
      const providerId = String(params.providerId ?? '');
      console.log(`[MSW] Intercepting GET ${apiPrefix}/provider/${providerId}/`);

      // Find any case that uses this providerId
      const mockCase = cases.find((c) => String(c.providerId) === providerId);

      if (!mockCase) {
        console.log(`[MSW] No mock case found for providerId=${providerId}`);
        return new HttpResponse(null, { status: 404 });
      }

      // Return ProviderDetail (keep fields your template/type expects)
      return HttpResponse.json({
        providerId,
        providerName: 'Mock Provider',
      });
    });

  return [getProviderChoicesHandler()];
};