import type { EligibilityCheck } from "#types/case-types.js";


// This file's code is what drives all the logic of
// - which questions go in which page
// - which page is next based on the answers given and the eligibility check state
//
// This is defined with the combination of FE_PAGES, FE_SECTIONS and getEligibilityCheckCompletion.
// The rest of functions are wrapper helpers to make it easier to make use of the core function
// getEligibilityCheckCompletion.
//
// TODO: Consider whether all the individual checks for each page inside getEligibilityCheckCompletion
// should be moved to separate functions for better readability and testability.


export interface FormRedirection {
    redirect: boolean;
    redirectTo: string;
}


export interface FormPage {
    questions: FinancialEligibilityFormQuestion[];
}


export interface FinancialEligibilityFormQuestion {
    fieldName: string;
    legendText: string;
    type: string;
}


export enum FinancialEligibilityPageCompletionStatus {
    COMPLETED = 'completed',
    INCOMPLETE = 'incomplete',
    NOT_REQUIRED = 'not-required'
}

export enum FinancialEligibilityPageId {
    ABOUT_YOU_AGED_17_OR_UNDER = 'about-you-aged-17-or-under',
    DO_YOU_HAVE_A_PARTNER = 'do-you-have-a-partner',
    ARE_YOU_AGED_60_OR_OVER = 'are-you-aged-60-or-over',
    PARTNER_INCOME = 'partner-income',
    BENEFITS = 'benefits'
}


const FE_PAGES: Record<string, FormPage> = {
    [FinancialEligibilityPageId.ABOUT_YOU_AGED_17_OR_UNDER]: {
        questions: [
            {
                fieldName: 'is_you_under_18',
                legendText: 'Are you aged 17 or under?',
                type: 'yes_or_no',
            }
        ],
    },
    [FinancialEligibilityPageId.DO_YOU_HAVE_A_PARTNER]: {
        questions: [
            {
                fieldName: 'has_partner',
                legendText: 'Do you have a partner?',
                type: 'yes_or_no',
            }
        ],
    },
    [FinancialEligibilityPageId.ARE_YOU_AGED_60_OR_OVER]: {
        questions: [
            {
                fieldName: 'are_you_aged_60_or_over',
                legendText: 'Are you aged 60 or over?',
                type: 'yes_or_no',
            }
        ],
    },
    [FinancialEligibilityPageId.PARTNER_INCOME]: {
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
    },
    [FinancialEligibilityPageId.BENEFITS]: {
        questions: [
            {
                fieldName: 'universal_credit',
                legendText: 'Are you in receipt of Universal Credit?',
                type: 'yes_or_no',
            }
        ],
    }
};

const FE_SECTIONS: Record<string, FinancialEligibilityPageId[]> = {
    'about-you': [
        FinancialEligibilityPageId.ABOUT_YOU_AGED_17_OR_UNDER,
        FinancialEligibilityPageId.DO_YOU_HAVE_A_PARTNER,
        FinancialEligibilityPageId.ARE_YOU_AGED_60_OR_OVER,
    ],
    'partner': [
        FinancialEligibilityPageId.PARTNER_INCOME
    ],
    'benefits': [
        FinancialEligibilityPageId.BENEFITS
    ]
};


/**
 * Determines the next form redirection based on the eligibility check state.
 * @param {string} caseReference - The case reference to use in the redirection URL
 * @param {string} comingFromPage - The page the user is coming from
 * @param {EligibilityCheck} eligibilityCheck - The eligibility check object to evaluate
 * @param {boolean} saveAndComeBackLater - Flag indicating if the user chose to save and come back later
 * @returns {FormRedirection} A FormRedirection object indicating whether to redirect and where
 */
export function getNextPageForEligibilityCheck(caseReference: string, comingFromPage: string, eligibilityCheck: EligibilityCheck, saveAndComeBackLater: boolean): FormRedirection {
    if (saveAndComeBackLater) {
        return {
            redirect: true,
            redirectTo: `/cases/${caseReference}/financial-eligibility`
        };
    }

    let pagesForSection: FinancialEligibilityPageId[] = [];
    for (const [section, pages] of Object.entries(FE_SECTIONS)) {
        for (const page of pages) {
            if (pages.includes(comingFromPage as FinancialEligibilityPageId)) {
                pagesForSection = pages;
                break;
            }
        }
    }

    console.log('Pages for section for comingFromPage', comingFromPage, ':', pagesForSection);

    if (pagesForSection.length === 0) {
        throw new Error(`No section found for comingFromPage: ${comingFromPage}`);
    }

    const pageFromIndex = pagesForSection.findIndex(page => page === comingFromPage);

    let nextPageIdx = pageFromIndex + 1;
    let nextPage: FinancialEligibilityPageId | undefined;
    let nextPageFound = false;
    while (nextPageIdx < pagesForSection.length) {
        nextPage = pagesForSection[nextPageIdx];
        if (pageIsNotRequired(nextPage, eligibilityCheck)) {
            nextPageIdx++;
        } else {
            nextPageFound = true;
            break;
        }
    }

    if (nextPageFound && nextPage) {
        return {
            redirect: true,
            redirectTo: `/cases/${caseReference}/financial-eligibility/${nextPage}`
        };
    } else {
        return {
            redirect: true,
            redirectTo: `/cases/${caseReference}/financial-eligibility`
        };
    }
}


/**
 * Retrieves the eligibility check steps status for the given case.
 * @param {EligibilityCheck} eligibilityCheck - The eligibility check object to evaluate
 * @returns {Record<string, 'completed' | 'incomplete' | 'not-required'>} A record of step statuses
 */
export function getEligibilityCheckSectionsCompletion(eligibilityCheck: EligibilityCheck): Record<string, FinancialEligibilityPageCompletionStatus> {
    const sectionsStatus: Record<string, FinancialEligibilityPageCompletionStatus> = {};
    const pagesCompletion = getEligibilityCheckPagesCompletion(eligibilityCheck);

    for (const [section, pages] of Object.entries(FE_SECTIONS)) {
        let sectionStatus: FinancialEligibilityPageCompletionStatus | undefined = undefined;
        for (const page of pages) {
            const pageCompletionStatus = pagesCompletion[page];

            if (pageCompletionStatus === FinancialEligibilityPageCompletionStatus.NOT_REQUIRED) {
                sectionStatus = FinancialEligibilityPageCompletionStatus.NOT_REQUIRED;
            } else if (pageCompletionStatus === FinancialEligibilityPageCompletionStatus.INCOMPLETE) {
                sectionStatus = FinancialEligibilityPageCompletionStatus.INCOMPLETE;
                break;
            }
        }

        if (sectionStatus === undefined) {
            sectionStatus = FinancialEligibilityPageCompletionStatus.COMPLETED;
        }

        sectionsStatus[section] = sectionStatus;
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
    const page = FE_PAGES[pageName];

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
    for (const [section, pages] of Object.entries(FE_SECTIONS)) {
        if (pages.includes(pageName as FinancialEligibilityPageId)) {
            return section;
        }
    }

    throw new Error(`No section found for page: ${pageName}`);
}



/** 
 * Determines whether a given page should be skipped based on the eligibility check state.
 * @param {FinancialEligibilityPageId} page - The page to evaluate
 * @param {EligibilityCheck} eligibilityCheck - The eligibility check object to evaluate
 * @returns {boolean} True if the page should be skipped, false otherwise
 */
function pageIsNotRequired(page: FinancialEligibilityPageId, eligibilityCheck: EligibilityCheck): boolean {
    const completionStatus = getEligibilityCheckPagesCompletion(eligibilityCheck)[page];
    return completionStatus === FinancialEligibilityPageCompletionStatus.NOT_REQUIRED;
}


/**
 * Gets the completion status of each eligibility check page.
 * @param {EligibilityCheck} eligibilityCheck - The eligibility check object to evaluate
 * @returns {Record<FinancialEligibilityPageId, FinancialEligibilityPageCompletionStatus>} A record mapping page IDs to their completion status
 */
export function getEligibilityCheckPagesCompletion(eligibilityCheck: EligibilityCheck): Record<FinancialEligibilityPageId, FinancialEligibilityPageCompletionStatus> {
    const completionStatus = {} as Record<FinancialEligibilityPageId, FinancialEligibilityPageCompletionStatus>;
    
    for (const pageId in FE_PAGES) {
        let statusForPage: FinancialEligibilityPageCompletionStatus;
        if (pageId === FinancialEligibilityPageId.DO_YOU_HAVE_A_PARTNER) {
            statusForPage = eligibilityCheck.is_you_under_18 ? FinancialEligibilityPageCompletionStatus.NOT_REQUIRED : (
                eligibilityCheck.has_partner !== undefined ? FinancialEligibilityPageCompletionStatus.COMPLETED : FinancialEligibilityPageCompletionStatus.INCOMPLETE
            );
        } else if (pageId === FinancialEligibilityPageId.ARE_YOU_AGED_60_OR_OVER) {
            statusForPage = eligibilityCheck.is_you_under_18 ? FinancialEligibilityPageCompletionStatus.NOT_REQUIRED : (
                eligibilityCheck.is_you_or_your_partner_over_60 !== null ? FinancialEligibilityPageCompletionStatus.COMPLETED : FinancialEligibilityPageCompletionStatus.INCOMPLETE);
        } else if (pageId === FinancialEligibilityPageId.PARTNER_INCOME) {
            statusForPage = eligibilityCheck.has_partner ? (
                eligibilityCheck.partner.income.earnings !== null ? FinancialEligibilityPageCompletionStatus.COMPLETED : FinancialEligibilityPageCompletionStatus.INCOMPLETE
            ) : FinancialEligibilityPageCompletionStatus.NOT_REQUIRED;
        } else {
            statusForPage = FinancialEligibilityPageCompletionStatus.COMPLETED;
        }

        completionStatus[pageId as FinancialEligibilityPageId] = statusForPage;
    }

    console.log('Eligibility check pages completion status:', completionStatus);

    return completionStatus;
}
