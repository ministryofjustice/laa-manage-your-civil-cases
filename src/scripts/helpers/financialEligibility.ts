import type { EligibilityCheck } from "#types/case-types.js";

export interface FormRedirection {
    redirect: boolean;
    redirectTo: string;
}


export interface FinancialEligibilityFormQuestion {
    fieldName: string;
    legendText: string;
    type: string;
}


const FORM_PAGES: Record<string, FinancialEligibilityFormQuestion[]> = {
    'about-you-aged-17-or-under': [
        {
            fieldName: 'is_you_under_18',
            legendText: 'Are you aged 17 or under?',
            type: 'yes_or_no'
        }
    ],
    'do-you-have-a-partner': [
        {
            fieldName: 'has_partner',
            legendText: 'Do you have a partner?',
            type: 'yes_or_no'
        }
    ],
    'partner-income': [
        {
            fieldName: 'partner_income',
            legendText: 'What is your partner’s earnings before tax?',
            type: 'value_per_interval'
        },
        {
            fieldName: 'self_employment_drawings',
            legendText: 'What is your partner’s self-employment drawings before tax?',
            type: 'value_per_interval'
        }
    ]
};


/**
 * Determines the next form redirection based on the eligibility check state.
 * @param {string} caseReference - The case reference to use in the redirection URL
 * @param {EligibilityCheck} eligibilityCheck - The eligibility check object to evaluate
 * @returns {FormRedirection} A FormRedirection object indicating whether to redirect and where
 */
export function getNextFormForEligibilityCheck(caseReference: string, eligibilityCheck: EligibilityCheck): FormRedirection {
    if (eligibilityCheck.state === 'in_progress') {
        if (eligibilityCheck.is_you_under_18 === false) {
            if (eligibilityCheck.has_partner === true) {
                return {
                    redirect: true,
                    redirectTo: `/cases/${caseReference}/financial-eligibility/partner-income`
                };
            } else {
                return {
                    redirect: true,
                    redirectTo: `/cases/${caseReference}/financial-eligibility/do-you-have-a-partner`
                };
            }
        }
    }

    return {
        redirect: false,
        redirectTo: ''
    };
}


/**
 * Retrieves the form question configuration for the given page name.
 * @param {string} pageName - The page name key to look up
 * @returns {FinancialEligibilityFormQuestion} The form question configuration
 * @throws {Error} If no form question is found for the given page name
 */
export function getQuestionsForPage(pageName: string): FinancialEligibilityFormQuestion[] {
    const question = FORM_PAGES[pageName];

    if (!question) {
        throw new Error(`No form question found for parameter: ${pageName}`);
    }

    return question;
}