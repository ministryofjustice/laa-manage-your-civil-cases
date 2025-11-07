/**
 * Shared validation helpers
 */

/**
 * Validate a string field with max length constraint
 */
export function validateStringField(
  data: any,
  fieldName: string,
  maxLength: number,
  errors: Record<string, string[]>
): void {
  if (fieldName in data) {
    if (typeof data[fieldName] !== 'string') {
      errors[fieldName] = ['Must be a string'];
    } else if (data[fieldName].length > maxLength) {
      errors[fieldName] = [`Ensure this field has no more than ${maxLength} characters.`];
    }
  }
}

/**
 * Validate a boolean field
 */
export function validateBooleanField(
  data: any,
  fieldName: string,
  errors: Record<string, string[]>
): void {
  if (fieldName in data && typeof data[fieldName] !== 'boolean') {
    errors[fieldName] = ['Must be a boolean'];
  }
}

/**
 * Validate a nullable boolean field
 */
export function validateNullableBooleanField(
  data: any,
  fieldName: string,
  errors: Record<string, string[]>
): void {
  if (fieldName in data && typeof data[fieldName] !== 'boolean' && data[fieldName] !== null) {
    errors[fieldName] = ['Must be a boolean or null'];
  }
}

/**
 * Validate a choice field
 */
export function validateChoiceField(
  data: any,
  fieldName: string,
  validChoices: string[],
  errors: Record<string, string[]>
): void {
  if (fieldName in data) {
    if (typeof data[fieldName] !== 'string') {
      errors[fieldName] = ['Must be a string'];
    } else if (!validChoices.includes(data[fieldName])) {
      errors[fieldName] = [`Must be one of: ${validChoices.join(', ')}`];
    }
  }
}

/**
 * Validate personal details nested object
 * Used by both personal_details and thirdparty_details endpoints
 */
export function validatePersonalDetails(personalDetails: any): Record<string, string[]> {
  const errors: Record<string, string[]> = {};

  if ('full_name' in personalDetails) {
    if (typeof personalDetails.full_name !== 'string') {
      errors.full_name = ['Must be a string'];
    } else if (personalDetails.full_name.length > 400) {
      errors.full_name = ['Ensure this field has no more than 400 characters.'];
    }
  }

  if ('postcode' in personalDetails) {
    if (typeof personalDetails.postcode !== 'string') {
      errors.postcode = ['Must be a string'];
    } else if (personalDetails.postcode.length > 12) {
      errors.postcode = ['Ensure this field has no more than 12 characters.'];
    }
  }

  if ('street' in personalDetails) {
    if (typeof personalDetails.street !== 'string') {
      errors.street = ['Must be a string'];
    } else if (personalDetails.street.length > 255) {
      errors.street = ['Ensure this field has no more than 255 characters.'];
    }
  }

  if ('mobile_phone' in personalDetails) {
    if (typeof personalDetails.mobile_phone !== 'string') {
      errors.mobile_phone = ['Must be a string'];
    } else if (personalDetails.mobile_phone.length > 20) {
      errors.mobile_phone = ['Ensure this field has no more than 20 characters.'];
    }
  }

  if ('home_phone' in personalDetails) {
    if (typeof personalDetails.home_phone !== 'string') {
      errors.home_phone = ['Must be a string'];
    } else if (personalDetails.home_phone.length > 20) {
      errors.home_phone = ['Ensure this field has no more than 20 characters.'];
    }
  }

  if ('email' in personalDetails) {
    if (typeof personalDetails.email !== 'string') {
      errors.email = ['Must be a string'];
    } else if (personalDetails.email.length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(personalDetails.email)) {
        errors.email = ['Enter a valid email address.'];
      }
    }
  }

  if ('safe_to_contact' in personalDetails) {
    if (typeof personalDetails.safe_to_contact !== 'string') {
      errors.safe_to_contact = ['Must be a string'];
    } else {
      const validChoices = ['SAFE', 'DONT_CALL'];
      if (!validChoices.includes(personalDetails.safe_to_contact)) {
        errors.safe_to_contact = [`Must be one of: ${validChoices.join(', ')}`];
      }
    }
  }

  return errors;
}

/**
 * Validate third party details top-level fields
 */
export function validateThirdPartyFields(thirdPartyData: any): Record<string, any> {
  const validationErrors: Record<string, any> = {};

  if ('pass_phrase' in thirdPartyData) {
    if (thirdPartyData.pass_phrase !== null && thirdPartyData.pass_phrase !== '' && typeof thirdPartyData.pass_phrase !== 'string') {
      validationErrors.pass_phrase = ['Must be a string, empty string, or null'];
    } else if (typeof thirdPartyData.pass_phrase === 'string' && thirdPartyData.pass_phrase.length > 255) {
      validationErrors.pass_phrase = ['Ensure this field has no more than 255 characters.'];
    }
  }

  if ('reason' in thirdPartyData) {
    if (thirdPartyData.reason !== null && thirdPartyData.reason !== '' && typeof thirdPartyData.reason !== 'string') {
      validationErrors.reason = ['Must be a string, empty string, or null'];
    } else if (typeof thirdPartyData.reason === 'string' && thirdPartyData.reason.length > 30) {
      validationErrors.reason = ['Ensure this field has no more than 30 characters.'];
    }
  }

  if ('personal_relationship' in thirdPartyData) {
    if (typeof thirdPartyData.personal_relationship !== 'string') {
      validationErrors.personal_relationship = ['Must be a string'];
    } else if (thirdPartyData.personal_relationship.length > 30) {
      validationErrors.personal_relationship = ['Ensure this field has no more than 30 characters.'];
    }
  }

  if ('personal_relationship_note' in thirdPartyData) {
    if (typeof thirdPartyData.personal_relationship_note !== 'string') {
      validationErrors.personal_relationship_note = ['Must be a string'];
    } else if (thirdPartyData.personal_relationship_note.length > 255) {
      validationErrors.personal_relationship_note = ['Ensure this field has no more than 255 characters.'];
    }
  }

  if ('spoke_to' in thirdPartyData) {
    if (typeof thirdPartyData.spoke_to !== 'boolean' && thirdPartyData.spoke_to !== null) {
      validationErrors.spoke_to = ['Must be a boolean or null'];
    }
  }

  if ('no_contact_reason' in thirdPartyData) {
    if (thirdPartyData.no_contact_reason !== null && typeof thirdPartyData.no_contact_reason !== 'string') {
      validationErrors.no_contact_reason = ['Must be a string or null'];
    }
  }

  if ('organisation_name' in thirdPartyData) {
    if (thirdPartyData.organisation_name !== null && thirdPartyData.organisation_name !== '' && typeof thirdPartyData.organisation_name !== 'string') {
      validationErrors.organisation_name = ['Must be a string, empty string, or null'];
    } else if (typeof thirdPartyData.organisation_name === 'string' && thirdPartyData.organisation_name.length > 255) {
      validationErrors.organisation_name = ['Ensure this field has no more than 255 characters.'];
    }
  }

  return validationErrors;
}
