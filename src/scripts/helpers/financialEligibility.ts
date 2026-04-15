import type { EligibilityCheck } from "#types/case-types.js";

export interface FormRedirection {
    redirect: boolean;
    redirectTo: string;
}


export interface FormPage {
    questions: FinancialEligibilityFormQuestion[];
    section: string;
}
export interface FinancialEligibilityFormQuestion {
    fieldName: string;
    legendText: string;
    type: string;
}


// This file's code is what drives all the logic of
// - which questions go in which page
// - which page is next based on the answers given and the eligibility check state
//
// This is defined with the combination of the FORM_PAGES constant and the function getAllIncompletePages.

const FORM_PAGES: Record<string, FormPage> = {
    'about-you-aged-17-or-under': {
        questions: [
            {
                fieldName: 'is_you_under_18',
                legendText: 'Are you aged 17 or under?',
                type: 'yes_or_no',
            }
        ],
        section: 'about-you'
    },
    'do-you-have-a-partner': {
        questions: [
            {
                fieldName: 'has_partner',
                legendText: 'Do you have a partner?',
                type: 'yes_or_no',
            }
        ],
        section: 'about-you'
    },
    'partner-income': {
        section: 'about-you',
        questions: [
        {
            fieldName: 'partner_income',
            legendText: 'What is your partner’s earnings before tax?',
            type: 'value_per_interval',
        },
        {
            fieldName: 'self_employment_drawings',
            legendText: 'What is your partner’s self-employment drawings before tax?',
            type: 'value_per_interval',
        }
    ]
    }
};


/**
 * Determines the next form redirection based on the eligibility check state.
 * @param {string} caseReference - The case reference to use in the redirection URL
 * @param {EligibilityCheck} eligibilityCheck - The eligibility check object to evaluate
 * @param {boolean} saveAndComeBackLater - Flag indicating if the user chose to save and come back later
 * @returns {FormRedirection} A FormRedirection object indicating whether to redirect and where
 */
export function getNextPageForEligibilityCheck(caseReference: string, eligibilityCheck: EligibilityCheck, saveAndComeBackLater: boolean): FormRedirection {
    if (saveAndComeBackLater) {
        return {
            redirect: true,
            redirectTo: `/cases/${caseReference}/financial-eligibility`
        };
    }

    const incompletePages = getAllIncompletePages(eligibilityCheck);

    if (incompletePages.length > 0) {
        return {
            redirect: true,
            redirectTo: `/cases/${caseReference}/financial-eligibility/${incompletePages[0]}`
        };
    }

    return {
        redirect: false,
        redirectTo: ''
    };
}

/**
 * Retrieves the eligibility check steps status for the given case.
 * @param {string} caseReference - The case reference
 * @param {EligibilityCheck} eligibilityCheck - The eligibility check object to evaluate
 * @returns {Record<string, 'completed' | 'incomplete' | 'not-required'>} A record of step statuses
 */
export function getEligibilityCheckSectionsStatus(caseReference: string, eligibilityCheck: EligibilityCheck): Record<string, 'completed' | 'incomplete' | 'not-required'> {
    const sectionsStatus: Record<string, 'completed' | 'incomplete' | 'not-required'> = {};

    const incompletePages = getAllIncompletePages(eligibilityCheck);

    console.log('Incomplete pages for case reference', caseReference, ':', incompletePages);

    for (const incompletePage of incompletePages) {
        const section = getSectionForPage(incompletePage);
        sectionsStatus[section] = 'incomplete';
    }

    return sectionsStatus;
}

/**
 * Retrieves all incomplete form pages based on the eligibility check state.
 * @param {EligibilityCheck} eligibilityCheck - The eligibility check object to evaluate
 * @returns {string[]} An array of incomplete page names
 */
export function getAllIncompletePages(eligibilityCheck: EligibilityCheck): string[] {
    const incompletePages: string[] = [];

    if (eligibilityCheck.is_you_under_18 === false && eligibilityCheck.has_partner === undefined) {
        incompletePages.push('do-you-have-a-partner');
    }

    if (eligibilityCheck.has_partner === true && eligibilityCheck.partner?.income?.earnings === null) {
        incompletePages.push('partner-income');
    }

    return incompletePages;
}


/**
 * Retrieves the form question configuration for the given page name.
 * @param {string} pageName - The page name key to look up
 * @returns {FinancialEligibilityFormQuestion} The form question configuration
 * @throws {Error} If no form question is found for the given page name
 */
export function getQuestionsForPage(pageName: string): FinancialEligibilityFormQuestion[] {
    const page = FORM_PAGES[pageName];

    if (!page) {
        throw new Error(`No form question found for parameter: ${pageName}`);
    }

    return page.questions;
}

/**
 * Retrieves the section name for the given page name.
 * @param {string} pageName - The page name key to look up
 * @returns {string} The section name for the page
 * @throws {Error} If no form question is found for the given page name
 */
export function getSectionForPage(pageName: string): string {
    const page = FORM_PAGES[pageName];

    if (!page) {
        throw new Error(`No form question found for parameter: ${pageName}`);
    }

    return page.section;
}