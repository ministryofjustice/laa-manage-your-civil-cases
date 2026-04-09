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


const FORM_PAGES: Record<string, FinancialEligibilityFormQuestion> = {
    'about-you-aged-17-or-under': {
        fieldName: 'is_you_under_18',
        legendText: 'Are you aged 17 or under?',
        type: 'yes_or_no'
    },
    'do-you-have-a-partner': {
        fieldName: 'has_partner',
        legendText: 'Do you have a partner?',
        type: 'yes_or_no'
    }
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
            return {
                redirect: true,
                redirectTo: `/cases/${caseReference}/financial-eligibility/do-you-have-a-partner`
            };
        }
    }

    return {
        redirect: false,
        redirectTo: ''
    };
}


/**
 * Retrieves the form question configuration for the given question parameter.
 * @param {string} questionParam - The question parameter key to look up
 * @returns {FinancialEligibilityFormQuestion} The form question configuration
 * @throws {Error} If no form question is found for the given parameter
 */
export function getFormQuestion(questionParam: string): FinancialEligibilityFormQuestion {
    const question = FORM_PAGES[questionParam];

    if (!question) {
        throw new Error(`No form question found for parameter: ${questionParam}`);
    }

    return question;
}