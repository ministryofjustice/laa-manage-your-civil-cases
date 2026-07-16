// Custom TypeScript goes in here.
import "#src/scripts/asciiArt.js";
import { initializeFormMethodLinks } from '#utils/client/formMethodHelper.js';

type Clarity = (command: string, ...args: string[]) => void;

interface ClarityWindow extends Window {
  clarity?: Clarity;
}

/**
 * Gets a meta tag content value by name
 * @param {string} name - Meta tag name attribute
 * @returns {string | null} Content value when present
 */
const getMetaContent = (name: string): string | null => {
  const metaElement = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  return metaElement?.content ?? null;
};

/**
 * Calls Clarity Identify API with a stable pseudonymous user identifier
 * @returns {void}
 */
const identifyClarityUser = (): void => {
  const clarityWindow = window as ClarityWindow;
  if (typeof clarityWindow.clarity !== 'function') {
    return;
  }

  const clarityUserId = getMetaContent('clarity-user-id');
  if (clarityUserId === null || clarityUserId === '') {
    return;
  }

  clarityWindow.clarity('identify', clarityUserId);
};

// Initialize form method links for data-method="post" handling
initializeFormMethodLinks();
identifyClarityUser();