/**
 * @file Tests for locale type generator functionality
 * Simple coverage tests for missing lines
 */

import { expect } from 'chai';
import sinon from 'sinon';
import fs from 'node:fs';
import path from 'node:path';
import {
  generateLocaleTypes,
  generateTypesFromFile,
  generateTypesForWorkspace,
  jsonToInterface
} from '#src/scripts/helpers/localeTypeGenerator.js';

describe('Locale Type Generator', () => {
  let consoleErrorStub: sinon.SinonStub;
  let consoleLogStub: sinon.SinonStub;

  beforeEach(() => {
    consoleErrorStub = sinon.stub(console, 'error');
    consoleLogStub = sinon.stub(console, 'log');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('jsonToInterface', () => {
    it('should return string for non-record input', () => {
      const result = jsonToInterface('not an object');
      expect(result).to.equal('string');
    });
  });

  describe('generateLocaleTypes', () => {
    it('should generate TypeScript interface from locale data', () => {
      const testData = {
        common: {
          back: 'Back',
          continue: 'Continue'
        },
        pages: {
          home: {
            title: 'Home Page'
          }
        }
      };

      const result = generateLocaleTypes(testData);

      expect(result).to.include('export interface LocaleStructure');
      expect(result).to.include('common: {');
      expect(result).to.include('back: string;');
      expect(result).to.include('pages: {');
      expect(result).to.include('Auto-generated TypeScript types');
    });

    it('should handle simple string properties', () => {
      const testData = { message: 'Hello' };
      const result = generateLocaleTypes(testData);

      expect(result).to.include('message: string;');
    });

    it('should handle non-object values in nested structures', () => {
      const testData = {
        nested: {
          stringValue: 'test',
          numberValue: 123,
          booleanValue: true,
          nullValue: null
        }
      };

      const result = generateLocaleTypes(testData);

      expect(result).to.include('stringValue: string;');
      expect(result).to.include('numberValue: string;');
      expect(result).to.include('booleanValue: string;');
      expect(result).to.include('nullValue: string;');
    });

    it('should handle non-record input at root level', () => {
      // Force the jsonToInterface function to hit the !isRecord condition
      // by calling generateLocaleTypes with a cast to bypass TypeScript checking
      const nonRecordInput = 'not an object' as any;
      const result = generateLocaleTypes(nonRecordInput);

      expect(result).to.include('string');
    });
  });

  describe('generateTypesFromFile', () => {
    it('should return true when file generation succeeds', () => {
      const readStub = sinon.stub(fs, 'readFileSync').returns('{"test": "value"}');
      const existsStub = sinon.stub(fs, 'existsSync').returns(true);
      const writeStub = sinon.stub(fs, 'writeFileSync');

      const result = generateTypesFromFile('/fake/input.json', '/fake/output.ts');

      expect(result).to.be.true;
      expect(writeStub.called).to.be.true;

      readStub.restore();
      existsStub.restore();
      writeStub.restore();
    });

    it('should return false when JSON parsing fails', () => {
      const readStub = sinon.stub(fs, 'readFileSync').returns('invalid json');

      const result = generateTypesFromFile('/fake/input.json', '/fake/output.ts');

      expect(result).to.be.false;
      expect(consoleErrorStub.called).to.be.true;

      readStub.restore();
    });

    it('should return false when JSON is not an object', () => {
      const readStub = sinon.stub(fs, 'readFileSync').returns('[]');

      const result = generateTypesFromFile('/fake/input.json', '/fake/output.ts');

      expect(result).to.be.false;
      expect(consoleErrorStub.called).to.be.true;

      readStub.restore();
    });

    it('should create output directory if it does not exist', () => {
      const readStub = sinon.stub(fs, 'readFileSync').returns('{"test": "value"}');
      const existsStub = sinon.stub(fs, 'existsSync').returns(false);
      const mkdirStub = sinon.stub(fs, 'mkdirSync');
      const writeStub = sinon.stub(fs, 'writeFileSync');

      generateTypesFromFile('/fake/input.json', '/fake/dir/output.ts');

      expect(mkdirStub.calledWith('/fake/dir', { recursive: true })).to.be.true;

      readStub.restore();
      existsStub.restore();
      mkdirStub.restore();
      writeStub.restore();
    });
  });

  describe('generateTypesForWorkspace', () => {
    it('should call the function and return a boolean', () => {
      // Simple test to ensure function declaration line is covered
      const readStub = sinon.stub(fs, 'readFileSync').returns('{"test": "value"}');
      const existsStub = sinon.stub(fs, 'existsSync').returns(true);
      const writeStub = sinon.stub(fs, 'writeFileSync');

      // This should cover line 109 (function declaration)
      const result = generateTypesForWorkspace();

      expect(typeof result).to.equal('boolean');

      readStub.restore();
      existsStub.restore();
      writeStub.restore();
    });

    it('should return true and log success when generation succeeds', () => {
      const readStub = sinon.stub(fs, 'readFileSync').returns('{"test": "value"}');
      const existsStub = sinon.stub(fs, 'existsSync').returns(true);
      const writeStub = sinon.stub(fs, 'writeFileSync');

      const result = generateTypesForWorkspace();

      expect(result).to.be.true;
      expect(consoleLogStub.calledWith('✅ Locale types generated successfully!')).to.be.true;

      readStub.restore();
      existsStub.restore();
      writeStub.restore();
    });

    it('should return false when generation fails', () => {
      const readStub = sinon.stub(fs, 'readFileSync').throws(new Error('File not found'));

      const result = generateTypesForWorkspace();

      expect(result).to.be.false;
      expect(consoleErrorStub.called).to.be.true;

      readStub.restore();
    });

    it('should construct correct file paths using process.cwd', () => {
      const readStub = sinon.stub(fs, 'readFileSync').returns('{"test": "value"}');
      const existsStub = sinon.stub(fs, 'existsSync').returns(true);
      const writeStub = sinon.stub(fs, 'writeFileSync');
      const cwdStub = sinon.stub(process, 'cwd').returns('/test/workspace');

      generateTypesForWorkspace();

      // Verify the correct paths were constructed
      expect(readStub.calledWith('/test/workspace/locales/en.json', 'utf8')).to.be.true;
      expect(writeStub.args[0][0]).to.equal('/test/workspace/src/scripts/helpers/localeTypes.ts');

      readStub.restore();
      existsStub.restore();
      writeStub.restore();
      cwdStub.restore();
    });
  });
});
