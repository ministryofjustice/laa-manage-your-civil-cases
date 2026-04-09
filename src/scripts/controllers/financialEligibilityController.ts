import type { Request, Response, NextFunction } from 'express';
import 'csrf-sync'; // Import to ensure CSRF types are loaded
import { handleGetEditForm, handlePostEditForm, extractFormFields } from '#src/scripts/helpers/index.js';
import { format } from 'node:path';
import { getFormQuestion, getNextFormForEligibilityCheck } from '../helpers/financialEligibility.js';
import type { EligibilityCheck } from '#types/case-types.js';


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
    const question = req.params.question as string;

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
                ...{questions: [
                    {
                        fieldName: getFormQuestion(question).fieldName,
                        legendText: getFormQuestion(question).legendText,
                        type: getFormQuestion(question).type
                    }
                ]},
                formAction: '/cases/' + req.params.caseReference + '/financial-eligibility/form',
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
    const formFields = extractFormFields(req.body, ['madeupFieldName', 'existingMadeupFieldName']);

    // TODO: perform save
    console.log('Form fields to save:', formFields);

    const formRedirection = getNextFormForEligibilityCheck(
        req.params.caseReference as string,
        {
            reference: '',
            category: '',
            your_problem_notes: '',
            notes: '',
            property_set: [],
            you: {} as EligibilityCheck['you'],
            partner: {} as EligibilityCheck['partner'],
            disputed_savings: {} as EligibilityCheck['disputed_savings'],
            dependants_young: 0,
            dependants_old: 0,
            is_you_or_your_partner_over_60: false,
            has_partner: false,
            on_passported_benefits: false,
            on_nass_benefits: false,
            state: 'in_progress',
            specific_benefits: {} as EligibilityCheck['specific_benefits'],
            disregards: {} as EligibilityCheck['disregards'],
            has_passported_proceedings_letter: false,
            under_18_passported: false,
            is_you_under_18: true,
            under_18_receive_regular_payment: false,
            under_18_has_valuables: false
        } as EligibilityCheck
    );

    if (formRedirection.redirect) {
        res.redirect(formRedirection.redirectTo);
    } else {
        res.redirect('/cases/' + req.params.caseReference + '/financial-eligibility');
    }
}