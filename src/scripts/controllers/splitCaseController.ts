import type { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { apiService } from '#src/services/apiService.js';
import { devLog, createProcessedError, safeString, safeBodyString, formatValidationError, validCaseReference, t, hasAllowedCaseStatus } from '#src/scripts/helpers/index.js';

const BAD_REQUEST = 400;

/**
 * Render the "split this case" form
 * @param {Request} req Express request object
 * @param {Response} res Express response object
 * @param {NextFunction} next Express next function
 * @returns {void} Rendered form page
 */
export async function getSplitThisCaseForm(req: Request, res: Response, next: NextFunction): Promise<void> {
  const caseReference = safeString(req.params.caseReference);
  const providerID = safeString(req.params.providerID);

  if (!validCaseReference(caseReference, res)) {
    return;
  }

  try {
    devLog(`Rendering split this case form for case: ${caseReference}`);

    // // Fetch provider choices from API
    // const providerChoicesResponse = await apiService.getProviderChoices(req.axiosMiddleware, caseReference);

    // if (providerChoicesResponse.status === 'error' || providerChoicesResponse.data === null) {
    //   const processedError = createProcessedError(
    //     new Error('Failed to fetch provider'),
    //     `rendering split this case form, for case ${caseReference}`
    //   );
    //   return next(processedError);
    // }

    // // Transform feedback choices into govukSelect items format
    // const categoryItems = [
    //   {
    //     value: '',
    //     text: t('pages.caseDetails.operatorFeedback.categoryPlaceholder'),
    //     selected: true
    //   },
    //   ...providerChoicesResponse.data.map(choice => ({
    //     value: choice.value,
    //     text: choice.display_name,
    //     selected: false
    //   }))
    // ];

    res.render('case_details/split-this-case.njk', {
      caseReference,
      client: req.clientData,
      errorState: {
        hasErrors: false,
        errors: [],
        fieldErrors: {}
      },
      csrfToken: typeof req.csrfToken === 'function' ? req.csrfToken() : undefined
    });
  } catch (error) {
    const processedError = createProcessedError(error, `rendering operator feedback form for case ${caseReference}`);
    next(processedError);
  }
}