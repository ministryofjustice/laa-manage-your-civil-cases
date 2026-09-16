import { Self, Condition, validation } from '@ministryofjustice/hmpps-forge/core/authoring'

// cla_backend rejects dependants counts above this (see cla_backend's dependants fields)
export const MAX_DEPENDANTS = 50;
export const MAX_DEPENDANTS_MESSAGE = 'Enter 50 or fewer dependants';

/**
 * Shared max-count validation for dependants fields, used identically for both age groups and for
 * the client's and partner's dependants pages.
 * @returns {unknown} The max-count validation rule
 */
export function dependantsMaxValidation() {
  return validation({
    condition: Self().match(Condition.Number.LessThanOrEqual(MAX_DEPENDANTS)),
    message: MAX_DEPENDANTS_MESSAGE,
  });
}
