const fs = require('fs');
const path = require('path');

// Simple CommonJS version of isRecord helper
function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Constants
const INTERFACE_NAME = 'LocaleStructure';
const INDENT_SIZE = 2;
const INITIAL_DEPTH = 0;
const NEXT_LEVEL = 1;

function jsonToInterface(obj, interfaceName = INTERFACE_NAME, depth = INITIAL_DEPTH) {
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

function generateLocaleTypes(localeData) {
  const interfaceContent = jsonToInterface(localeData);

  return `/**
 * Auto-generated TypeScript types for locale data
 * Generated on: ${new Date().toISOString()}
 */

${interfaceContent}
`;
}

function generateTypesForWorkspace() {
  const localeFilePath = path.join(process.cwd(), 'locales', 'en.json');
  const outputFilePath = path.join(process.cwd(), 'src', 'scripts', 'helpers', 'localeTypes.ts');

  try {
    if (!fs.existsSync(localeFilePath)) {
      console.error(`❌ Locale file not found: ${localeFilePath}`);
      return false;
    }

    // Read and parse the JSON file
    const jsonContent = fs.readFileSync(localeFilePath, 'utf8');
    const parsed = JSON.parse(jsonContent);

    if (!isRecord(parsed)) {
      console.error('❌ Invalid JSON structure - expected object');
      return false;
    }

    // Generate the TypeScript content
    const typeContent = generateLocaleTypes(parsed);

    // Ensure output directory exists
    const outputDir = path.dirname(outputFilePath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write the file
    fs.writeFileSync(outputFilePath, typeContent);

    return true;
  } catch (error) {
    console.error(`❌ Error generating locale types: ${error.message}`);
    return false;
  }
}

// Main execution
console.log('🔧 Generating locale types...');
const success = generateTypesForWorkspace();

if (!success) {
  process.exit(1);
}

console.log('✅ Locale types generated successfully!');
