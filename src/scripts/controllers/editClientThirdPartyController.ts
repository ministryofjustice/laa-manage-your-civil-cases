import type { Request, Response, NextFunction } from 'express';
import 'csrf-sync'; // Import to ensure CSRF types are loaded
import { handleGetEditForm, handlePostEditForm, extractFormFields } from '#src/scripts/helpers/index.js';

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
  const formFields = extractFormFields(req.body, [
    'thirdPartyFullName', 'existingThirdPartyFullName',
    'thirdPartyEmailAddress', 'existingThirdPartyEmailAddress',
    'thirdPartyContactNumber', 'existingThirdPartyContactNumber',
    'thirdPartySafeToCall', 'existingThirdPartySafeToCall',
    'thirdPartyAddress', 'existingThirdPartyAddress',
    'thirdPartyPostcode', 'existingThirdPartyPostcode',
    'thirdPartyRelationshipToClient', 'existingThirdPartyRelationshipToClient'
  ]);

  await handlePostEditForm(req, res, next, {
    templatePath: 'case_details/edit-client-third-party.njk',
    fields: [
      { name: 'thirdPartyFullName', value: formFields.thirdPartyFullName, existingValue: formFields.existingThirdPartyFullName },
      { name: 'thirdPartyEmailAddress', value: formFields.thirdPartyEmailAddress, existingValue: formFields.existingThirdPartyEmailAddress },
      { name: 'thirdPartyContactNumber', value: formFields.thirdPartyContactNumber, existingValue: formFields.existingThirdPartyContactNumber },
      { name: 'thirdPartySafeToCall', value: formFields.thirdPartySafeToCall, existingValue: formFields.existingThirdPartySafeToCall },
      { name: 'thirdPartyAddress', value: formFields.thirdPartyAddress, existingValue: formFields.existingThirdPartyAddress },
      { name: 'thirdPartyPostcode', value: formFields.thirdPartyPostcode, existingValue: formFields.existingThirdPartyPostcode },
      { name: 'thirdPartyRelationshipToClient', value: formFields.thirdPartyRelationshipToClient, existingValue: formFields.existingThirdPartyRelationshipToClient }
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
        }
      }
    }
  });
}
