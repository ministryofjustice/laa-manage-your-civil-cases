/* c8 ignore next 3 */
/**
 * TypeScript utility to generate locale types from JSON structure
 */

import fs from 'node:fs';
import path from 'node:path';
import { isRecord } from './dataTransformers.js';

// Constants
const INTERFACE_NAME = 'LocaleStructure';
const INDENT_SIZE = 2;
const INITIAL_DEPTH = 0;
const NEXT_LEVEL = 1;

/**
 * Convert a JSON object to TypeScript interface string
 * @param {unknown} obj - The JSON object to convert
 * @param {string} interfaceName - Name of the interface (for root level)
 * @param {number} depth - Current nesting depth
 * @returns {string} Generated TypeScript interface string
 */
export function jsonToInterface(obj: unknown, interfaceName = INTERFACE_NAME, depth = INITIAL_DEPTH): string {
  if (!isRecord(obj)) {
    return 'string';
  }

  const indent = ' '.repeat(INDENT_SIZE * depth);
  const nextIndent = ' '.repeat(INDENT_SIZE * (depth + NEXT_LEVEL));

  let result = depth === INITIAL_DEPTH ? `export interface ${interfaceName} {\n` : '{\n';

  for (const [key, value] of Object.entries(obj)) {
    if (isRecord(value)) {
      result += `${nextIndent}${key}: ${jsonToInterface(value, '', depth + NEXT_LEVEL)}`;
    } else {
      result += `${nextIndent}${key}: string;\n`;
    }
  }

  result += `${indent}}${depth === INITIAL_DEPTH ? '' : ';\n'}`;
  return result;
}

/**
 * Generate TypeScript interface from locale JSON data
 * @param {Record<string, unknown>} localeData - The locale data object
 * @returns {string} Generated TypeScript file content
 */
export function generateLocaleTypes(localeData: Record<string, unknown>): string {
  const interfaceContent = jsonToInterface(localeData);

  return `/**
 * Auto-generated TypeScript types for locale data
 *
 * DO NOT EDIT MANUALLY - This file is auto-generated
 */

${interfaceContent}
`;
}

/**
 * Generate and write locale types from JSON file
 * @param {string} localeFilePath - Path to the locale JSON file
 * @param {string} outputFilePath - Path where TypeScript file should be written
 * @returns {boolean} True if successful, false otherwise
 */
export function generateTypesFromFile(
  localeFilePath: string,
  outputFilePath: string
): boolean {
  try {
    // Read and parse the JSON file
    const jsonContent = fs.readFileSync(localeFilePath, 'utf8');
    const parsed: unknown = JSON.parse(jsonContent);

    if (!isRecord(parsed)) {
      throw new Error('Invalid JSON structure - expected object');
    }

    // Type guard to ensure we have a valid object structure
    const localeData = parsed;

    // Generate the TypeScript content
    const typeContent = generateLocaleTypes(localeData);

    // Ensure output directory exists
    const outputDir = path.dirname(outputFilePath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write the file
    fs.writeFileSync(outputFilePath, typeContent);

    return true;
  } catch (error) {
    console.error(`❌ Error generating locale types: ${String(error)}`);
    return false;
  }
}

/**
 * Generate types from current workspace locale file
 * @returns {boolean} True if successful, false otherwise
 */
export function generateTypesForWorkspace(): boolean {
  const localeFilePath = path.join(process.cwd(), 'locales', 'en.json');
  const outputFilePath = path.join(process.cwd(), 'src', 'scripts', 'helpers', 'localeTypes.ts');

  const success = generateTypesFromFile(localeFilePath, outputFilePath);

  if (success) {
    console.log('✅ Locale types generated successfully!');
  }

  return success;
}
