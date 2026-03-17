
import { http, HttpResponse } from 'msw';

export const createNewCaseHandlers = (
  apiBaseUrl: string,
  apiPrefix: string
) => {

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

  return [getAllCategoriesHandler()];
};
