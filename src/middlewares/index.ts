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