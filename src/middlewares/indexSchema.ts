/**
 * Index for middleware schemas, which validate forms
 *
 * Usage:
 * import { validateEditClientName } from '#src/middlewares/index.js';
 */

export {
  validateEditClientName
} from './clientNameSchema.js';

export {
  validateEditClientDateOfBirth
} from './clientDateOfBirthSchema.js';

export {
  validateEditClientPhoneNumber
} from './clientPhoneNumberSchema.js';

export {
  validateEditClientEmailAddress
} from './clientEmailAddressSchema.js';

export {
  validateEditClientAddress
} from './clientAddressSchema.js';

export {
  validateAddClientThirdParty,
  validateEditClientThirdParty
} from './clientThirdPartySchema.js';

export {
  validateAddClientSupportNeeds,
  validateEditClientSupportNeeds
} from './clientSupportNeedsSchema.js';

export {
  validateReopenCase
} from './reopenCaseSchema.js'

export {
  validateCloseCase
} from './closeCaseSchema.js'

export {
  validatePendingCase
} from './pendingCaseSchema.js'

export {
  validateOperatorFeedback
} from './operatorFeedbackSchema.js'

export {
  validateProviderNote
} from './providerNoteSchema.js'

export {
  fetchClientDetails
} from './caseDetailsMiddleware.js'

export {
  validateGiveFeedback
} from './giveFeedbackSchema.js'