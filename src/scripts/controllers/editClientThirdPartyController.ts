import type { Request, Response, NextFunction } from 'express';
import 'csrf-sync'; // Import to ensure CSRF types are loaded
import { handleGetEditForm, handlePostEditForm, extractFormFields, safeApiField } from '#src/scripts/helpers/index.js';
import { apiService } from '#src/services/apiService.js';

/**
 * Renders the edit client third party form for a given case reference.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>}
 */
export async function getEditClientThirdParty(req: Request, res: Response, next: NextFunction): Promise<void> {
  await handleGetEditForm(req, res, next, {
    templatePath: 'case_details/edit-client-third-party.njk',
    fieldConfigs: [
      { field: 'thirdPartyFullName', type: 'string', includeExisting: true },
      { field: 'thirdPartyEmailAddress', type: 'string', includeExisting: true },
      { field: 'thirdPartyContactNumber', type: 'string', includeExisting: true },
      { field: 'thirdPartySafeToCall', type: 'boolean', includeExisting: true },
      { field: 'thirdPartyAddress', type: 'string', includeExisting: true },
      { field: 'thirdPartyPostcode', type: 'string', includeExisting: true },
      { field: 'thirdPartyRelationshipToClient', type: 'string', includeExisting: true }
    ]
  });
}

/**
 * Handles the submission of the edit third party form for a given case reference.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>}
 */
export async function postEditClientThirdParty(req: Request, res: Response, next: NextFunction): Promise<void> {
  const response = await apiService.getClientDetails(req.axiosMiddleware, req.params.caseReference);
  const { data: apiData } = response;

  const existingValues = {
    thirdPartyFullName: safeApiField(apiData, 'thirdPartyFullName', 'string'),
    thirdPartyEmailAddress: safeApiField(apiData, 'thirdPartyEmailAddress', 'string'),
    thirdPartyContactNumber: safeApiField(apiData, 'thirdPartyContactNumber', 'string'),
    thirdPartySafeToCall: safeApiField(apiData, 'thirdPartySafeToCall', 'boolean'),
    thirdPartyAddress: safeApiField(apiData, 'thirdPartyAddress', 'string'),
    thirdPartyPostcode: safeApiField(apiData, 'thirdPartyPostcode', 'string'),
    thirdPartyRelationshipToClient: safeApiField(apiData, 'thirdPartyRelationshipToClient', 'string'),
    thirdPartyPassphraseSetUp: safeApiField(apiData, 'thirdPartyPassphraseSetUp', 'string'),
    thirdPartyPassphrase: safeApiField(apiData, 'thirdPartyPassphrase', 'string')
  };

  const formFields = extractFormFields(req.body, [
    'thirdPartyFullName',
    'thirdPartyEmailAddress',
    'thirdPartyContactNumber',
    'thirdPartySafeToCall',
    'thirdPartyAddress',
    'thirdPartyPostcode',
    'thirdPartyRelationshipToClient',
    'thirdPartyPassphraseSetUp',
    'thirdPartyPassphrase'
  ]);

  await handlePostEditForm(req, res, next, {
    templatePath: 'case_details/edit-client-third-party.njk',
    fields: [
      { name: 'thirdPartyFullName', value: formFields.thirdPartyFullName, existingValue: existingValues.thirdPartyFullName },
      { name: 'thirdPartyEmailAddress', value: formFields.thirdPartyEmailAddress, existingValue: existingValues.thirdPartyEmailAddress },
      { name: 'thirdPartyContactNumber', value: formFields.thirdPartyContactNumber, existingValue: existingValues.thirdPartyContactNumber },
      { name: 'thirdPartySafeToCall', value: formFields.thirdPartySafeToCall, existingValue: existingValues.thirdPartySafeToCall },
      { name: 'thirdPartyAddress', value: formFields.thirdPartyAddress, existingValue: existingValues.thirdPartyAddress },
      { name: 'thirdPartyPostcode', value: formFields.thirdPartyPostcode, existingValue: existingValues.thirdPartyPostcode },
      { name: 'thirdPartyRelationshipToClient', value: formFields.thirdPartyRelationshipToClient, existingValue: existingValues.thirdPartyRelationshipToClient },
      { name: 'thirdPartyPassphraseSetUp', value: formFields.thirdPartyPassphraseSetUp, existingValue: existingValues.thirdPartyPassphraseSetUp },
      { name: 'thirdPartyPassphrase', value: formFields.thirdPartyPassphrase, existingValue: existingValues.thirdPartyPassphrase }
    ],
    apiUpdateData: {
      thirdParty: {
        fullName: formFields.thirdPartyFullName,
        emailAddress: formFields.thirdPartyEmailAddress,
        contactNumber: formFields.thirdPartyContactNumber,
        safeToCall: formFields.thirdPartySafeToCall !== '' ? formFields.thirdPartySafeToCall : true,
        address: formFields.thirdPartyAddress,
        postcode: formFields.thirdPartyPostcode,
        relationshipToClient: {
          selected: Array.isArray(formFields.thirdPartyRelationshipToClient) ? formFields.thirdPartyRelationshipToClient : [formFields.thirdPartyRelationshipToClient]
        },
        passphraseSetUp: {
          selected: Array.isArray(formFields.thirdPartyPassphraseSetUp) ? formFields.thirdPartyPassphraseSetUp : [formFields.thirdPartyPassphraseSetUp],
          passphrase: formFields.thirdPartyPassphrase
        }
      }
    }
  });
}
