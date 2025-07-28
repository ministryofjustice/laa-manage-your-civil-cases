// Optional for your frontend
/**
 * @file Custom TypeScript for GOV.UK Frontend Express.
 * Displays an ASCII art banner and job availability information in the console.
 *
 * ASCII Art created by: https://patorjk.com/software/taag/#p=display&f=Graffiti&t=Type%20Something%20
 */

import type { DisplayConsoleBannerFunction } from '#types/ascii-art-types.js';

/**
 * Messages to display in the console.
 */
const messages: string[] = [
    "Welcome to GOVUK Frontend Express.",
    "Like what you see? Want to work with us?",
    "View our job availabilities or sign up for alerts:",
    "https://www.jobtrain.co.uk/justicedigital"
];

/**
 * Joins messages into a single formatted string with line breaks.
 * @returns {string} Formatted message string
 */
const getFormattedMessage = (): string => messages.join("\n");

/**
 * Displays an ASCII Art banner with department name in the console.
 * @returns {void}
 */
const displayConsoleBanner: DisplayConsoleBannerFunction = (): void => {
    console.log(`
  __  __  ____       _ 
 |  \\/  |/ __ \\     | |
 | \\  / | |  | |    | |
 | |\\/| | |  | |_   | |
 | |  | | |__| | |__| |
 |_|  |_|\\____/ \\____/  

${getFormattedMessage()}
`);
};

// Run banner display when the script loads
displayConsoleBanner();

export { displayConsoleBanner };