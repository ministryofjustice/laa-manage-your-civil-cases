import type { EffectFunctionContext } from "@ministryofjustice/hmpps-forge/core";
import { type FinancialEligibilityEffectsWithDeps, type Deps } from '#packages/financial-eligibility-journey/src/api.js';
import { getOrMigrateCasePatternDrafts } from '#packages/financial-eligibility-journey/src/casePatternDrafts.js';
import { type FinancialEligibilitySession } from '#packages/financial-eligibility-journey/src/context.type.js';
import { under18Step, under18HasValuablesStep, under18RegularPaymentStep, partnerStep, over60Step, over60StepWithPartnerStep, disregardsStep } from "#packages/financial-eligibility-journey/src/index.js";
import { type FinancialEligibilityData } from "#types/api-types.js";
import { devLog, devError, devWarn, normaliseSelectedCheckbox, normaliseSelectedKeys, toYesNo, toBoolean, toNumber } from '#src/scripts/helpers/index.js';

/**
 * Utility function to map step codes to API field names for financial eligibility data
 * @param {string} stepCode - The code of the step to map
 * @returns {string | null} The corresponding API field name, or null if no mapping exists
 */
function mapStepCodeToApiField(stepCode: string): string | null {
    const mapping: Record<string, string> = {
        [under18Step.code]: 'is_you_under_18',
        [under18RegularPaymentStep.code]: 'under_18_receive_regular_payment',
        [under18HasValuablesStep.code]: 'under_18_has_valuables',
        [partnerStep.code]: 'has_partner',
        [over60Step.code]: 'is_you_or_your_partner_over_60',
        [over60StepWithPartnerStep.code]: 'is_you_or_your_partner_over_60',
        'universal-credit': 'universal_credit',
        'income-support': 'income_support',
        'income-based-jsa': 'job_seekers_allowance',
        'pension-credit': 'pension_credit',
        'employment-support': 'employment_support',
        'propertySet': 'property_set',
        'bank-balance': 'bank_balance',
        'investment-balance': 'investment_balance',
        'asset-balance': 'asset_balance',
        'credit-balance': 'credit_balance',
        'bank-balance-partner': 'bank_balance',
        'investment-balance-partner': 'investment_balance',
        'asset-balance-partner': 'asset_balance',
        'credit-balance-partner': 'credit_balance',
        'bank-balance-disputed': 'bank_balance',
        'investment-balance-disputed': 'investment_balance',
        'asset-balance-disputed': 'asset_balance',
        'credit-balance-disputed': 'credit_balance',
        [disregardsStep.code]: 'disregards',
    };

    return mapping[stepCode] || null;
}

/**
 * Utility function to map financial eligibility API data to step codes for use in the Forge journey
 * @param {FinancialEligibilityData} financialEligibilityData - The financial eligibility data from the API
 * @returns {Record<string, unknown>} A record mapping step codes to their corresponding values
 */
function mapFinancialEligibilityApiDataToStepCodes(financialEligibilityData: FinancialEligibilityData): Record<string, unknown> {
    return {
        category: financialEligibilityData.category,
        [under18Step.code]: financialEligibilityData.isUnder17,
        [under18RegularPaymentStep.code]: financialEligibilityData.under18RegularPayment,
        [under18HasValuablesStep.code]: financialEligibilityData.under18HasValuables,
        [partnerStep.code]: financialEligibilityData.hasPartner,
        [over60Step.code]: financialEligibilityData.isOver60,
        [over60StepWithPartnerStep.code]: financialEligibilityData.isOver60,
        'universal-credit': financialEligibilityData.specificBenefits.universalCredit,
        'income-support': financialEligibilityData.specificBenefits.incomeSupport,
        'income-based-jsa': financialEligibilityData.specificBenefits.jobSeekers,
        'pension-credit': financialEligibilityData.specificBenefits.pensionCredit,
        'employment-support': financialEligibilityData.specificBenefits.employmentSupport,
        'propertySet': financialEligibilityData.propertySet,
        'bank-balance': financialEligibilityData.clientData.savings?.bankBalance,
        'investment-balance': financialEligibilityData.clientData.savings?.investmentBalance,
        'asset-balance': financialEligibilityData.clientData.savings?.assetBalance,
        'credit-balance': financialEligibilityData.clientData.savings?.creditBalance,
        'bank-balance-partner': financialEligibilityData.partnerData.partnerSavings?.bankBalance,
        'investment-balance-partner': financialEligibilityData.partnerData.partnerSavings?.investmentBalance,
        'asset-balance-partner': financialEligibilityData.partnerData.partnerSavings?.assetBalance,
        'credit-balance-partner': financialEligibilityData.partnerData.partnerSavings?.creditBalance,
        'bank-balance-disputed': financialEligibilityData.disputedSavings?.bankBalance,
        'investment-balance-disputed': financialEligibilityData.disputedSavings?.investmentBalance,
        'asset-balance-disputed': financialEligibilityData.disputedSavings?.assetBalance,
        'credit-balance-disputed': financialEligibilityData.disputedSavings?.creditBalance,
        'disregards': financialEligibilityData.disregards,
    }
}

/**
 * Normalises a property collection from Forge answers to a consistent format for API submission
 * @param {unknown} value - An array of property objects
 * @returns {Record<string, unknown>[]} - An array of property objects with consistent field names
 */
function normalisePropertyCollectionForForge(value: unknown): Record<string, unknown>[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.map(item => {
        const property = item as Record<string, unknown>;
        return {
            'value': property.value,
            'mortgage-left': property['mortgage-left'] ?? property.mortgageLeft,
            'share': property.share,
            'disputed': toYesNo(property.disputed),
            'main': toYesNo(property.main),
        };
    });
}


/**
 * Extracts a property collection from Forge answers, checking both the explicit propertySet and indexed fields
 * @param {Record<string, unknown>} answers - The Forge answers object containing property data
 * @returns {Record<string, unknown>[]} - An array of property objects with consistent field names
 */
function getPropertyCollectionFromAnswers(answers: Record<string, unknown>): Record<string, unknown>[] {
    if (Array.isArray(answers.propertySet)) {
        return normalisePropertyCollectionForForge(answers.propertySet);
    }

    const grouped = new Map<number, Record<string, unknown>>();
    const allowedPropertyFields = new Set(['value', 'mortgage-left', 'share', 'disputed', 'main']);

    for (const [key, value] of Object.entries(answers)) {
        // Use `lastIndexOf(_)` to split each key e.g `value_1` becomes `value` and `1`
        const separatorIndex = key.lastIndexOf('_');

        // Skip keys that don't have invalid indices or match allowedPropertyFields
        if (separatorIndex <= 0 || separatorIndex === key.length - 1) {
            continue;
        }

        const fieldCode = key.slice(0, separatorIndex);
        if (!allowedPropertyFields.has(fieldCode)) {
            continue;
        }

        // Parse the index part of the key and make sure it's a valid non-negative integer
        const indexPart = key.slice(separatorIndex + 1);
        const index = Number(indexPart);
        if (!Number.isInteger(index) || index < 0) {
            continue;
        }

        // Group the values by index, creating a new object for each index if it doesn't already exist e.g [[0, {...}], [1, {...}], [2, {...}]]
        const existing = grouped.get(index) ?? {};
        existing[fieldCode] = value;
        grouped.set(index, existing);
    }

    // Sort the grouped entries by index and map them to an array of property objects with consistent field names
    return [...grouped.entries()]
        .sort(([left], [right]) => left - right)
        .map(([, item]) => ({
            'value': item.value,
            'mortgage-left': item['mortgage-left'],
            'share': item.share,
            'disputed': toYesNo(item.disputed),
            'main': toYesNo(item.main),
        }));
}

/**
 * Utility function to map API values to Forge answer values based on step codes
 * @param {unknown} apiValue - The value from the API to map
 * @param {string} stepCode - The code of the step to determine the mapping
 * @returns {unknown} The corresponding Forge answer value
 */
function mapApiValueToForgeValue(apiValue: unknown, stepCode: string): unknown {
    return {
        category: String(apiValue ?? '').toLowerCase(),
        [under18Step.code]: apiValue ? 'yes' : 'no',
        [under18RegularPaymentStep.code]: apiValue ? 'yes' : 'no',
        [under18HasValuablesStep.code]: apiValue ? 'yes' : 'no',
        [partnerStep.code]: apiValue ? 'yes' : 'no',
        [over60Step.code]: apiValue ? 'yes' : 'no',
        [over60StepWithPartnerStep.code]: apiValue ? 'yes' : 'no',
        'universal-credit': apiValue ? 'yes' : 'no',
        'income-support': apiValue ? 'yes' : 'no',
        'income-based-jsa': apiValue ? 'yes' : 'no',
        'pension-credit': apiValue ? 'yes' : 'no',
        'employment-support': apiValue ? 'yes' : 'no',
        'propertySet': normalisePropertyCollectionForForge(apiValue),
        'bank-balance': apiValue,
        'investment-balance': apiValue,
        'asset-balance': apiValue,
        'credit-balance': apiValue,
        'bank-balance-partner': apiValue,
        'investment-balance-partner': apiValue,
        'asset-balance-partner': apiValue,
        'credit-balance-partner': apiValue,
        'bank-balance-disputed': apiValue,
        'investment-balance-disputed': apiValue,
        'asset-balance-disputed': apiValue,
        'credit-balance-disputed': apiValue,
        [disregardsStep.code]: normaliseSelectedKeys(apiValue).length > 0 ? normaliseSelectedKeys(apiValue) : ['none'],
    }[stepCode];
}

/**
 * Maps a Forge property collection to an API property set format
 * @param {Record<string, unknown>[]} collection - An array of property objects from Forge answers
 * @returns {Record<string, unknown>[]} - An array of property objects formatted for API submission
 */
function mapForgePropertyCollectionToApiPropertySet(collection: Record<string, unknown>[]): Record<string, unknown>[] {
    return collection.map(item => ({
        value: Math.round(toNumber(item.value) * 100),
        mortgage_left: Math.round(toNumber(item['mortgage-left']) * 100),
        share: toNumber(item.share),
        disputed: toBoolean(item.disputed),
        main: toBoolean(item.main),
    }));
}

/**
 * Utility function to map user answers from the Forge journey to the API payload format
 * @param {Record<string, unknown>} answers - The user's answers keyed by step code
 * @returns {Record<string, unknown>} The API payload with mapped field names and values
 */
export function mapAnswersToApiPayload(answers: Record<string, unknown>): Record<string, unknown> {
    const payload: Record<string, unknown> = {};
    const specificBenefits: Record<string, unknown> = {};
    const savings: Record<string, unknown> = {};
    const partnerSavings: Record<string, unknown> = {};
    const disputedSavings: Record<string, unknown> = {};
    const disregards: Record<string, boolean> = {};

    const benefitFields = ['universal_credit', 'income_support', 'job_seekers_allowance', 'pension_credit', 'employment_support'];
    const savingsFields = ['bank_balance', 'investment_balance', 'asset_balance', 'credit_balance'];
    const partnerSavingsFields = ['bank-balance-partner', 'investment-balance-partner', 'asset-balance-partner', 'credit-balance-partner'];
    const disputedSavingsFields = ['bank-balance-disputed', 'investment-balance-disputed', 'asset-balance-disputed', 'credit-balance-disputed'];

    for (const [stepCode, answer] of Object.entries(answers)) {
        const apiField = mapStepCodeToApiField(stepCode);
        if (apiField) {
            let value = answer;

            if (typeof answer === 'string') {
                if (answer.toLowerCase() === 'yes') {
                    value = true;
                } else if (answer.toLowerCase() === 'no') {
                    value = false;
                }
            }

            if (benefitFields.includes(apiField)) {
                specificBenefits[apiField] = value;
            } else if (partnerSavingsFields.includes(stepCode)) {
                partnerSavings[apiField] = Math.round(toNumber(value) * 100);
            } else if (disputedSavingsFields.includes(stepCode)) {
                disputedSavings[apiField] = Math.round(toNumber(value) * 100);
            } else if (savingsFields.includes(apiField)) {
                savings[apiField] = Math.round(toNumber(value) * 100);
            } else if (stepCode === disregardsStep.code) {
                normaliseSelectedCheckbox(value).forEach(disregard => {
                    disregards[disregard] = true;
                });
                payload[apiField] = disregards;
            } else {
                payload[apiField] = value;
            }
        }
    }

    if (Object.keys(specificBenefits).length > 0) {
        payload.specific_benefits = specificBenefits;
        // Default `on_passported_benefits` to false unless conditions met
        payload.on_passported_benefits = benefitFields.some( (field) => specificBenefits[field] === true );
    }

    if (Object.keys(savings).length > 0) {
        payload.you = { savings };
    }

    if (Object.keys(partnerSavings).length > 0) {
        payload.partner = { savings: partnerSavings };
    }

    if (Object.keys(disputedSavings).length > 0) {
        payload.disputed_savings = disputedSavings;
    }

    const propertyCollection = getPropertyCollectionFromAnswers(answers);
    const hasExplicitPropertySet = Array.isArray(answers.propertySet);
    if (propertyCollection.length > 0 || hasExplicitPropertySet) {
        payload.property_set = mapForgePropertyCollectionToApiPropertySet(propertyCollection);
    }

    // Default `under_18_passported` to false unless conditions met
    payload.under_18_passported = payload.is_you_under_18 === true && payload.under_18_receive_regular_payment === false && payload.under_18_has_valuables === false;

    return payload;
}

/**
 * This class implements the FinancialEligibilityWithDeps interface, providing methods to handle financial eligibility operations with dependencies.
 * It uses the provided dependencies to perform actions such as loading draft answers, clearing drafts, persisting saved answers, and loading case details.
 */
export class FinancialEligibilityEffectsWithDepsImpl implements FinancialEligibilityEffectsWithDeps {

    private readonly apiService: Record<string, CallableFunction>;

    /**
     * Constructs an instance of FinancialEligibilityEffectsWithDepsImpl with the provided API service.
     * @param {Record<string, CallableFunction>} apiService - The API service to be used for financial eligibility operations
     */
    constructor(apiService: Record<string, CallableFunction>) {
        this.apiService = apiService;
    }

    /**
     * Loads case details from the middleware and stores them in the context, for use in the journey
     * The client data has already been fetched by fetchClientDetails middleware to avoid duplicate API calls
     * @param {Deps} _deps Effect dependencies supplied by Forge
     * @param {EffectFunctionContext} context The context of the effect function, providing access to request parameters and session data
     */
    LoadCaseDetails = async (_deps: Deps, context: EffectFunctionContext): Promise<void> => {
        const caseReference = context.getRequestParam('caseReference');

        if (caseReference === undefined) {
            devError('No case reference found in path');
            return;
        }

        // Get client data from res.locals (set by fetchClientDetails middleware)
        // This avoids a duplicate API call since the middleware already fetched it
        const clientData = context.getState('client');
        
        if (!clientData) {
            devError('Client data not found in state; fetchClientDetails middleware may not have run');
            return;
        }
        
        devLog(`Using pre-fetched case details for case reference ${caseReference}`);
        context.setData('caseDetails', { status: 'success', data: clientData });
    }

    /**
     * Loads financial eligibility data from the API, checks if any questions have been answered so that they
     * take precedence over the API data, and stores the results in Forge's answers.
     * @param {Deps} _deps Effect dependencies supplied by Forge, expected to include a getFinancialEligibility function
     * @param {EffectFunctionContext} context The context of the effect function, providing access to request parameters and session data
     */
    LoadCaseFinancialEligibility = async (_deps: Deps, context: EffectFunctionContext): Promise<void> => {
        const caseReference = context.getRequestParam('caseReference');
        const PROPERTY_STEP_CODE = 'properties';
        const PROPERTY_COLLECTION_CODE = 'propertySet';

        if (caseReference === undefined) {
            devError('No case reference found in path');
            return;
        }

        const axiosMiddleware = context.getState('authenticatedAxios')
        if (!axiosMiddleware) {
            devWarn('Authenticated Axios middleware not found in state; API call may fail if it is required by the service implementation.');
        }
        const financialEligibilityResponse = await this.apiService.getFinancialEligibility(axiosMiddleware, caseReference);
        
        const session = context.getSession() as FinancialEligibilitySession | undefined;
        if (!session) {
            devError('No session found; cannot load financial eligibility data');
            return;
        }

        if (!session.financialEligibilityDrafts) {
            session.financialEligibilityDrafts = {};
        }

        if (!(caseReference in session.financialEligibilityDrafts)) {
            session.financialEligibilityDrafts[caseReference] = {};
        }

        const mappedAnswers = mapFinancialEligibilityApiDataToStepCodes(financialEligibilityResponse.data);
        for (const [stepCode, apiValue] of Object.entries(mappedAnswers)) {
            const caseFEDraft = session.financialEligibilityDrafts[caseReference];
            if (stepCode in caseFEDraft) {

                // If the step code already exists in the session draft, we use that value instead of the API value to ensure that any user-entered data takes precedence over the API data
                const draftValue = stepCode === disregardsStep.code ? normaliseSelectedCheckbox(caseFEDraft[stepCode]) : caseFEDraft[stepCode];
                caseFEDraft[stepCode] = draftValue;
                context.setAnswer(stepCode, draftValue);
            } else {
                const answerValue = mapApiValueToForgeValue(apiValue, stepCode);
                context.setAnswer(stepCode, answerValue);
            }
        }

        const casePatternDrafts = getOrMigrateCasePatternDrafts(session, caseReference);
        if (!casePatternDrafts[PROPERTY_STEP_CODE]) {
            casePatternDrafts[PROPERTY_STEP_CODE] = {};
        }

        const existingPatternCollection = casePatternDrafts[PROPERTY_STEP_CODE][PROPERTY_COLLECTION_CODE];
        if (Array.isArray(existingPatternCollection)) {
            context.setAnswer(PROPERTY_COLLECTION_CODE, existingPatternCollection);
            return;
        }

        // If there's no existing property collection in the session draft, we use the API value to populate the property collection & in Forge's answers
        const propertyDraftCollection = getPropertyCollectionFromAnswers(session.financialEligibilityDrafts[caseReference]);
        const apiPropertyCollection = normalisePropertyCollectionForForge(mappedAnswers.propertySet);
        const propertyCollectionToStore = propertyDraftCollection.length > 0 ? propertyDraftCollection : apiPropertyCollection;

        if (propertyCollectionToStore.length > 0) {
            casePatternDrafts[PROPERTY_STEP_CODE][PROPERTY_COLLECTION_CODE] = propertyCollectionToStore;
            context.setAnswer(PROPERTY_COLLECTION_CODE, propertyCollectionToStore);
        }
    }

    /**
     * Persists saved answers from session to the backend API.
     * @param {Deps} _deps Effect dependencies supplied by Forge, expected to include an apiService with an updateFinancialEligibility function
     * @param {EffectFunctionContext} context The context of the effect function, providing access to request parameters and session data
     */
    PersistSavedAnswers = async (_deps: Deps, context: EffectFunctionContext): Promise<void> => {
        devLog(`Saving FE answers in session... ${JSON.stringify(context.getAllAnswers())}`);
        
        const session = context.getSession() as FinancialEligibilitySession | undefined;
        const PROPERTY_STEP_CODE = 'properties';
        const PROPERTY_COLLECTION_CODE = 'propertySet';
    
        if (!session) {
            return;
        }
    
        const caseReference = context.getRequestParam('caseReference')
        if (caseReference === undefined) {
            devError('No case reference found in path; cannot submit draft answers');
            return;
        }
    
        if (!session.financialEligibilityDrafts[caseReference]) {
            session.financialEligibilityDrafts[caseReference] = {};
        }

        // Merge the answers from Forge's context into the session draft for the case reference
        const submissionAnswers: Record<string, unknown> = {
            ...session.financialEligibilityDrafts[caseReference],
        };

        const casePatternDrafts = getOrMigrateCasePatternDrafts(session, caseReference);
        const patternPropertyCollection = casePatternDrafts[PROPERTY_STEP_CODE]?.[PROPERTY_COLLECTION_CODE];
        if (Array.isArray(patternPropertyCollection)) {
            submissionAnswers.propertySet = patternPropertyCollection;
        }

        const submissionPayload = mapAnswersToApiPayload(submissionAnswers);
    
        // Make API call to CLA backend with the apiService.
        const axiosMiddleware = context.getState('authenticatedAxios')
        if (!axiosMiddleware) {
            devWarn("Authenticated Axios middleware not found in state; API call may fail if it is required by the service implementation.");
        }
        await this.apiService.updateFinancialEligibility(
            axiosMiddleware,
            context.getRequestParam('caseReference'),
            submissionPayload
        );
    
        devLog(`Submitted FE answers in session, to cla_backend: ${JSON.stringify(session.financialEligibilityDrafts[caseReference])}`);
    }

    /**
     * Clears draft financial eligibility answers from the session.
     * @param {Deps} _deps Effect dependencies supplied by Forge
     * @param {EffectFunctionContext} context The context of the effect function, providing access to request parameters and session data
     */
    ClearDraftAnswers = async (_deps: Deps, context: EffectFunctionContext): Promise<void> => {
        const session = context.getSession() as FinancialEligibilitySession | undefined;

        const caseReference = context.getRequestParam('caseReference')
        if (caseReference === undefined) {
            devError('No case reference found in path; cannot clear draft answers');
            return;
        }

        // Clear the draft answers for the case reference from the session
        if (session?.financialEligibilityDrafts[caseReference]) {
            delete session.financialEligibilityDrafts[caseReference];

            // Also clear any case pattern drafts for the case reference
            if (session.casePatternDrafts?.[caseReference]) {
                delete session.casePatternDrafts[caseReference];
            }

            context.getAllAnswers();
        }
    }

    /**
     * Saves a new answer if it has been answered, by checking the post data for any answers and saving them to the session as drafts.
     * @param {Deps} _deps Effect dependencies supplied by Forge
     * @param {EffectFunctionContext} context The context of the effect function, providing access to request parameters and session data
     */
    SaveNewAnswerIfAnswered = async (_deps: Deps, context: EffectFunctionContext): Promise<void> => {
        const requestPostData = context.getAllPostData<Record<string, unknown>>();
        const answerKeys = Object.keys(requestPostData);

        if (answerKeys.length === 0) {
            return;
        }

        const caseReference = context.getRequestParam('caseReference')
        if (caseReference === undefined) {
            devError('No case reference found in path; cannot save new answer');
            return;
        }
        const session = context.getSession() as FinancialEligibilitySession | undefined;

        if (!session) {
            return;
        }

        if (!session.financialEligibilityDrafts[caseReference]) {
            session.financialEligibilityDrafts[caseReference] = {};
        }

        for (const key of answerKeys) {
            const value = requestPostData[key];
            if (value !== undefined && value !== null && value !== '') {
                // Normalise the value for disregards step, to handle when only one disregard is selected
                const normalisedValue = key === disregardsStep.code ? normaliseSelectedCheckbox(value) : value;

                session.financialEligibilityDrafts[caseReference][key] = normalisedValue;

                // Also set the answer in the context so that Forge can handle redirections correctly
                context.setAnswer(key, normalisedValue);
            }
        }

        devLog(`Saved new FE answers in session... ${JSON.stringify(session.financialEligibilityDrafts)}`);
    }

}