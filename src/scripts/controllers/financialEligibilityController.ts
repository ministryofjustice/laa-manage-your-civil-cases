import type { Request, Response, NextFunction } from 'express';
import 'csrf-sync'; // Import to ensure CSRF types are loaded
import { handleGetEditForm, handlePostEditForm, extractFormFields, safeString, validCaseReference } from '#src/scripts/helpers/index.js';
import { format } from 'node:path';
import { getQuestionsForPage, getNextPageForEligibilityCheck, getEligibilityCheckSectionsCompletion, getEligibilityCheckPagesCompletion } from '../helpers/financialEligibility.js';
import type { EligibilityCheck, EligibilityPerson } from '#types/case-types.js';


// Defining hardcoded eligibility check data to be used in the financial eligibility forms until
// the API integration is done. Change the values in this object to test different scenarios in
// the forms and the logic that drives them.
const FAKE_ELIGIBILITY_CHECK: EligibilityCheck = {
    reference: '',
    category: '',
    your_problem_notes: '',
    notes: '',
    property_set: [],
    you: {} as EligibilityCheck['you'],
    partner: {
        income: {
            earnings: null,
        }
    } as EligibilityCheck['partner'],
    disputed_savings: {} as EligibilityCheck['disputed_savings'],
    dependants_young: 0,
    dependants_old: 0,
    is_you_or_your_partner_over_60: null,
    has_partner: true,
    on_passported_benefits: false,
    on_nass_benefits: false,
    state: 'in_progress',
    specific_benefits: {} as EligibilityCheck['specific_benefits'],
    disregards: {} as EligibilityCheck['disregards'],
    has_passported_proceedings_letter: false,
    under_18_passported: false,
    is_you_under_18: false,
    under_18_receive_regular_payment: false,
    under_18_has_valuables: false
};

/**
 * Retrieves the financial eligibility details tab form.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 */
export async function getFinancialEligibilityDetailsTab(req: Request, res: Response, next: NextFunction): Promise<void> {
    await handleGetEditForm(req, res, next, {
        templatePath: 'case_details/financial_eligibility/about-you.njk',
        fieldConfigs: [
            { field: 'benefits', type: 'string', includeExisting: true }
        ]
    });
}


/**
 * Retrieves the financial eligibility dynamic fields form.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>} A promise that resolves when the form is rendered
 */
export async function getFinancialEligibilityFieldsForm(req: Request, res: Response, next: NextFunction): Promise<void> {
    const page = req.params.page as string;

    const questions = getQuestionsForPage(page);
    if (!questions) {
        res.status(404).send('Page not found');
        return;
    }

    await handleGetEditForm(req, res, next, {
        templatePath: `case_details/financial_eligibility/form.njk`,
        /**
         * Transforms client support needs API data for field extraction
         * @param {unknown} apiData - API response data containing nested third party object
         * @returns {Record<string, unknown>} Flattened data structure for field extraction
         */
        dataExtractor: (apiData: unknown): Record<string, unknown> => {
            return {
                apiData,
                ...{questions: questions.map(question => ({
                    fieldName: question.fieldName,
                    legendText: question.legendText,
                    type: question.type
                }))},
                formAction: '/cases/' + req.params.caseReference + '/financial-eligibility/form',
                pageId: page
            };
        }
    });
}


/**
 * Handles posting financial eligibility dynamic fields form.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} _next - Express next middleware function
 */
export async function postFinancialEligibilityFieldsForm(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const formFields = extractFormFields(req.body, ['madeupFieldName', 'existingMadeupFieldName', 'continue', 'saveAndComeBackLater']);

    // TODO: perform save
    console.log('Form fields to save:', formFields);
    console.log('Coming from:', req.body.pageId);

    // formRedirection being hardcoded. It needs to be the result of calling the CLA API.
    const formRedirection = getNextPageForEligibilityCheck(
        req.params.caseReference as string,
        req.body.pageId as string,
        FAKE_ELIGIBILITY_CHECK,
        formFields.saveAndComeBackLater === 'true'
    );

    if (formRedirection.redirect) {
        res.redirect(formRedirection.redirectTo);
    } else {
        res.redirect('/cases/' + req.params.caseReference + '/financial-eligibility');
    }
}


/**
 * Renders the financial eligibility edit assessment form for a given case reference.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>}
 */
export async function getFinancialEligibilityEditAssessmentSteps(req: Request, res: Response, next: NextFunction): Promise<void> {
    const caseReference = safeString(req.params.caseReference);

    if (!validCaseReference(caseReference, res)) {
        return;
    }

    const sectionsStatus = getEligibilityCheckSectionsCompletion(FAKE_ELIGIBILITY_CHECK);

    console.log('Sections status:', sectionsStatus);

    res.render('case_details/financial_eligibility/edit-assessment-steps.njk', {
        caseReference,
        client: req.clientData,
        sectionsStatus
    });

}