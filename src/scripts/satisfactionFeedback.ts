type SectionName = 'initial' | 'messageYes' | 'messageNo' | 'final';
type Sections = Record<SectionName, HTMLElement>;

/**
 * Returns the first element matching the provided CSS selector
 * @template T - The expected element type
 * @param {string} selector - A valid CSS selector string
 * @returns {T | null} The matching element, or `null` if no element is found
 */
const getElement = <T extends Element>(selector: string): T | null =>
  document.querySelector<T>(selector);

document.addEventListener('DOMContentLoaded', () => {
  const initial = getElement<HTMLElement>('[data-feedback-section="initial"]');
  const messageYes = getElement<HTMLElement>('[data-feedback-section="messageYes"]');
  const messageNo = getElement<HTMLElement>('[data-feedback-section="messageNo"]');
  const final = getElement<HTMLElement>('[data-feedback-section="final"]');

  if (!initial || !messageYes || !messageNo || !final) return;

  const sections: Sections = { initial, messageYes, messageNo, final };

  /**
   * Displays the specified feedback section and hides all others
   * @param {SectionName} name - The name of the section to display
   * @returns {void}
   */
  const show = (name: SectionName): void => {
    (Object.keys(sections) as SectionName[]).forEach((key) => {
      sections[key].hidden = key !== name;
    });
  };

  show('initial');

  let satisfaction: 'Yes' | 'No' | null = null;

  const satisfactionButtons = document.querySelectorAll<HTMLButtonElement>(
    '[data-feedback-role="initial-trigger-yes"], [data-feedback-role="initial-trigger-no"]'
  );

  satisfactionButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const value = button.textContent?.trim();
      if (value === 'Yes') {
        satisfaction = value;
        show('messageYes');
      }

      if (value === 'No') {
        satisfaction = value;
        show('messageNo');
      }
    });
  });

  const cancelButtons = document.querySelectorAll<HTMLButtonElement>('[data-feedback-role="cancel"]');
  cancelButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const form = button.closest('form');
      const commentInput = form?.querySelector<HTMLTextAreaElement>('textarea[name="satisfactionComment"]');

      if (commentInput) {
        commentInput.value = '';
      }

      show('initial');
    });
  });

  const submitButtons = document.querySelectorAll<HTMLButtonElement>('[data-feedback-role="submit-text"]');
  submitButtons.forEach((button) => {
    button.addEventListener('click', async () => {
      const form = button.closest('form');
      const commentInput = form?.querySelector<HTMLTextAreaElement>('textarea[name="satisfactionComment"]');
      const comment = commentInput?.value.trim() ?? '';
      const csrfToken = form?.querySelector<HTMLInputElement>('input[name="_csrf"]')?.value ?? '';

      await fetch('/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'CSRF-Token': csrfToken
        },
        body: JSON.stringify({
          satisfaction,
          comment,
          submittedAt: new Date().toISOString()
        })
      });

      show('final');
    });
  });
});