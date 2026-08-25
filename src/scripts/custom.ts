// Custom TypeScript goes in here.
import "#src/scripts/asciiArt.js";
import { initializeFormMethodLinks } from '#utils/client/formMethodHelper.js';
import { initializeSessionTimeoutWarning } from '#utils/client/sessionTimeoutHelper.js';

// Initialize form method links for data-method="post" handling
initializeFormMethodLinks();
initializeSessionTimeoutWarning();