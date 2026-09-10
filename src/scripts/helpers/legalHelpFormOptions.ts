// Single source of truth for the legal help form's "additional circumstances" checkboxes,
// shared by the interstitial's checkbox list, the destination page's labels and server-side validation.
export interface LegalHelpFormCircumstanceOption {
  value: string;
  labelKey: string;
}

export const LEGAL_HELP_FORM_CIRCUMSTANCE_OPTIONS: LegalHelpFormCircumstanceOption[] = [
  { value: 'ecf', labelKey: 'ecf' },
  { value: 'accepted-child-or-patient', labelKey: 'acceptedChildOrPatient' },
  { value: 'legal-help-same-matter', labelKey: 'legalHelpSameMatter' }
];

export const LEGAL_HELP_FORM_CIRCUMSTANCE_VALUES: string[] = LEGAL_HELP_FORM_CIRCUMSTANCE_OPTIONS.map(({ value }) => value);
