/**
 * Client-side JavaScript helper functions for common UI interactions
 * These functions are meant to be included in templates and executed in the browser
 */

/**
 * Returns a generic accessible-autocomplete phantom value fix function as a string
 * This can be included in any template that uses accessible-autocomplete components
 *
 * @returns {string} JavaScript code as a string to be inserted into templates
 */
export function getAccessibleAutocompleteFix(): string {
  return `
    // Generic accessible-autocomplete phantom value fix
    function setupAccessibleAutocompleteFix(inputId) {
      const autocompleteInput = document.getElementById(inputId);
      const selectElement = document.getElementById(inputId + '-select');

      if (autocompleteInput && selectElement) {
        function clearSelectWhenInputEmpty() {
          if (this.value.trim() === '') {
            selectElement.value = '';
            selectElement.selectedIndex = 0;
          }
        }

        autocompleteInput.addEventListener('input', clearSelectWhenInputEmpty);
        autocompleteInput.addEventListener('keyup', clearSelectWhenInputEmpty);

        return true;
      }
      return false;
    }
  `;
}

/**
 * Returns JavaScript code for setting up accessible-autocomplete fix with conditional content
 * Handles cases where the autocomplete is inside conditional content (like GOV.UK checkboxes)
 *
 * @param {string} inputId - The ID of the autocomplete input element
 * @param {string} triggerSelector - CSS selector for the element that triggers showing the conditional content
 * @returns {string} JavaScript code as a string to be inserted into templates
 */
export function getConditionalAccessibleAutocompleteFix(inputId: string, triggerSelector: string): string {
  return `
    ${getAccessibleAutocompleteFix()}

    // Setup for conditional accessible-autocomplete
    document.addEventListener('DOMContentLoaded', function() {
      const triggerElement = document.querySelector('${triggerSelector}');
      if (triggerElement) {
        triggerElement.addEventListener('change', function() {
          if (this.checked) {
            setTimeout(() => setupAccessibleAutocompleteFix('${inputId}'), 100);
          }
        });
      }

      // Try to setup immediately in case trigger is already active
      setupAccessibleAutocompleteFix('${inputId}');
    });
  `;
}
