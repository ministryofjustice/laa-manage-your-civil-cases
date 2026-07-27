type SectionName = 'initial' | 'message' | 'final';
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
  const message = getElement<HTMLElement>('[data-feedback-section="message"]');
  const final = getElement<HTMLElement>('[data-feedback-section="final"]');

  if (!initial || !message || !final) return;

  const sections: Sections = { initial, message, final };

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

  const satisfactionForms = document.querySelectorAll<HTMLFormElement>(
    '[data-feedback-role="satisfaction-form"]'
  );

  satisfactionForms.forEach((form) => {
    form.addEventListener('submit', (event: SubmitEvent) => {
      event.preventDefault();

      const submitter = event.submitter;
      if (!(submitter instanceof HTMLButtonElement)) return;

      const value = submitter.textContent?.trim();
      if (value === 'Yes' || value === 'No') {
        satisfaction = value;
      }

      show('message');
    });
  });

  const skipButton = getElement<HTMLButtonElement>('[data-feedback-role="skip"]');
  skipButton?.addEventListener('click', () => {
    show('final');
  });

  const commentForm = getElement<HTMLFormElement>('[data-feedback-role="comment-form"]');
  const commentInput = getElement<HTMLTextAreaElement>('#comment');

  commentForm?.addEventListener('submit', async (event: SubmitEvent) => {
    event.preventDefault();

    const comment = commentInput?.value.trim() ?? '';

    const csrfToken = document.querySelector<HTMLInputElement>('input[name="_csrf"]')?.value ?? '';

    await fetch('/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'CSRF-Token': csrfToken },
      body: JSON.stringify({
        satisfaction,
        comment,
        submittedAt: new Date().toISOString(),
      }),
    });

    show('final');
  });
});