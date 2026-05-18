
import type { Request, Response } from 'express';
import { setSessionValue } from '#src/scripts/helpers/sessionHelpers.js';
import { safeString } from '#src/scripts/helpers/dataTransformers.js';

/**
 * Handles no changes made to a form field.
 * If the current value matches the existing value, a warning banner is set
 * in session storage and the user is redirected back to the client details page.
 *
 * @param {Request} req - The Express request object containing route params and session.
 * @param {Response} res - The Express response object used to perform the redirect.
 * @param {Array<{ current: unknown; existing: unknown }>} fields - Array of field objects containing current and existing values for comparison.
 * @returns {boolean} Returns true if a redirect was triggered due to no changes, otherwise false.
 */
export function handleNoChangeRedirect(
  req: Request,
  res: Response,
  fields: Array<{ current: unknown; existing: unknown }>
): boolean {

  const noChanges = fields.every(field => {
    const current = safeString(field.current ?? field.existing).trim();
    const existing = safeString(field.existing).trim();
    return current === existing;
  });


  if (noChanges) {
    setSessionValue(req, 'noChangeWarningBanner', {
      variant: 'warning',
      title: 'No changes were made',
      dismissible: true
    });

    res.redirect(`/cases/${req.params.caseReference}/client-details`);
    return true;
  }

  return false;
}
