/**
 * Client-side utility to handle POST requests via links with data-method="post" attribute
 * This allows links in MOJ Button Menu to submit as POST requests with CSRF protection
 */

/**
 * Initialize form method links to handle POST requests via data-method attribute
 * Listens for clicks on links with data-method="post" and submits them as form POST requests
 * @returns {void}
 */
export function initializeFormMethodLinks(): void {
  // Handle links with data-method="post"
  document.addEventListener('click', (event) => {
    const { target } = event;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const link = target.closest('a[data-method="post"]');
    if (!(link instanceof HTMLAnchorElement)) {
      return;
    }

    event.preventDefault();

    // Create a hidden form
    const form = document.createElement('form');
    const { href } = link;
    form.method = 'POST';
    form.action = href;
    form.style.display = 'none';

    // Add CSRF token if available
    const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]');
    if (csrfToken !== null) {
      const tokenInput = document.createElement('input');
      const { content } = csrfToken;
      tokenInput.type = 'hidden';
      tokenInput.name = '_csrf';
      tokenInput.value = content;
      form.appendChild(tokenInput);
    }

    // Append form to body and submit
    document.body.appendChild(form);
    form.submit();
  });
}
