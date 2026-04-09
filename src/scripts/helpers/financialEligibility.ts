import type { EligibilityCheck } from "#types/case-types.js";

export interface FormRedirection {
    redirect: boolean;
    redirectTo: string;
}

/**
 * Determines the next form redirection based on the eligibility check state.
 * @param {EligibilityCheck} eligibilityCheck - The eligibility check object to evaluate
 * @returns {FormRedirection} A FormRedirection object indicating whether to redirect and where
 */
export function getNextFormForEligibilityCheck(eligibilityCheck: EligibilityCheck): FormRedirection {
    if (eligibilityCheck.state === 'in_progress') {
        return {
            redirect: true,
            redirectTo: `/cases/${eligibilityCheck.reference}/financial-eligibility`
        };
    }

    return {
        redirect: false,
        redirectTo: ''
    };
}


const FORM_PAGES = {
    'about-you-aged-17-or-under': {
        'formActionUrl': '/financial-eligibility/form',
        
    }
};