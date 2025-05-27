/**
 * Appends "-static" to the incoming string for testing mocha, chai & typescript config.
 * @param {string} incomingText - Placeholder parameter for testing purposes.
 * @returns {string} The transformed string with "-static" appended.
 */
export default function(incomingText: string) {
  return `${incomingText}-static`;
}