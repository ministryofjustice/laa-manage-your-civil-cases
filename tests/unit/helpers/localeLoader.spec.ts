/**
 * @file Tests for locale loader functionality
 * Comprehensive coverage with minimal test code using real en.json data
 */

import { expect } from 'chai';
import sinon from 'sinon';
import fs from 'node:fs';
import i18next from 'i18next';
import {
  createLocaleLoader,
  getLocaleLoader,
  loadLocaleData,
  getText,
  hasText,
  t,
  clearLocaleCache,
  getDefaultLocaleLoader
} from '#src/scripts/helpers/localeLoader.js';

describe('Locale Loader', () => {
  let consoleErrorStub: sinon.SinonStub;
  let consoleLogStub: sinon.SinonStub;

  beforeEach(() => {
    consoleErrorStub = sinon.stub(console, 'error');
    consoleLogStub = sinon.stub(console, 'log');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('loadLocaleData', () => {
    it('should load valid locale data from file', () => {
      const result = loadLocaleData('en');
      expect(result).to.be.an('object');
      expect(result.common).to.be.an('object');
      expect((result.common as any).back).to.equal('Back');
    });

    it('should handle missing locale file', () => {
      const existsStub = sinon.stub(fs, 'existsSync').returns(false);
      const result = loadLocaleData('nonexistent');
      expect(result).to.deep.equal({});
      expect(consoleErrorStub.called).to.be.true;
      existsStub.restore();
    });

    it('should handle file read errors', () => {
      const existsStub = sinon.stub(fs, 'existsSync').returns(true);
      const readStub = sinon.stub(fs, 'readFileSync').throws(new Error('Read error'));
      const result = loadLocaleData('en');
      expect(result).to.deep.equal({});
      expect(consoleErrorStub.called).to.be.true;
      existsStub.restore();
      readStub.restore();
    });

    it('should handle invalid JSON', () => {
      const existsStub = sinon.stub(fs, 'existsSync').returns(true);
      const readStub = sinon.stub(fs, 'readFileSync').returns('invalid json');
      const result = loadLocaleData('en');
      expect(result).to.deep.equal({});
      expect(consoleErrorStub.called).to.be.true;
      existsStub.restore();
      readStub.restore();
    });

    it('should handle non-object JSON', () => {
      const existsStub = sinon.stub(fs, 'existsSync').returns(true);
      const readStub = sinon.stub(fs, 'readFileSync').returns('"string"');
      const result = loadLocaleData('en');
      expect(result).to.deep.equal({});
      expect(consoleErrorStub.called).to.be.true;
      existsStub.restore();
      readStub.restore();
    });
  });

  describe('createLocaleLoader', () => {
    it('should create loader with proxy access to locale data', async () => {
      const loader = await createLocaleLoader();

      // Test proxy access to nested data from en.json
      expect((loader.t as any).common.back).to.equal('Back');
      expect((loader.t as any).pages.search.heading).to.equal('Search for a case');
      expect((loader.t as any).navigation.mainNav.yourCases).to.equal('Your cases');
    });

    it('should handle get method with valid keys', async () => {
      const loader = await createLocaleLoader();
      expect(loader.get('common.back')).to.equal('Back');
      expect(loader.get('pages.search.heading')).to.equal('Search for a case');
    });

    it('should handle get method with replacements', async () => {
      const loader = await createLocaleLoader();
      const result = loader.get('pages.yourCases.pageTitles.new', { serviceName: 'Test Service' });
      expect(result).to.include('Test Service');
    });

    it('should handle get method errors', async () => {
      const loader = await createLocaleLoader();
      const i18nextStub = sinon.stub(i18next, 't').throws(new Error('Translation error'));
      const result = loader.get('nonexistent.key');
      expect(result).to.equal('nonexistent.key');
      expect(consoleErrorStub.called).to.be.true;
      i18nextStub.restore();
    });

    it('should handle exists method', async () => {
      const loader = await createLocaleLoader();
      expect(loader.exists('common.back')).to.be.true;
      expect(loader.exists('nonexistent.key')).to.be.false;
    });
  });

  describe('Synchronous functions', () => {
    it('should handle getText with valid keys', () => {
      const result = getText('common.back');
      expect(result).to.be.a('string');
    });

    it('should handle getText errors', () => {
      const i18nextStub = sinon.stub(i18next, 't').throws(new Error('Translation error'));
      const result = getText('nonexistent.key');
      expect(result).to.equal('nonexistent.key');
      expect(consoleErrorStub.called).to.be.true;
      i18nextStub.restore();
    });

    it('should handle hasText with valid keys', () => {
      const result = hasText('common.back');
      expect(result).to.be.a('boolean');
    });

    it('should handle hasText errors', () => {
      const i18nextStub = sinon.stub(i18next, 'exists').throws(new Error('Exists error'));
      const result = hasText('test.key');
      expect(result).to.be.false;
      expect(consoleErrorStub.called).to.be.true;
      i18nextStub.restore();
    });
  });

  describe('Proxy functionality', () => {
    it('should handle symbol property access', async () => {
      const loader = await createLocaleLoader();
      const symbolProp = Symbol('test');
      expect((loader.t as any)[symbolProp]).to.be.undefined;
    });

    it('should handle nested object access', async () => {
      const loader = await createLocaleLoader();
      const commonStatus = (loader.t as any).common.status;
      expect(commonStatus).to.be.an('object');
      expect(commonStatus.new).to.equal('New');
    });

    it('should handle non-existent properties', async () => {
      const loader = await createLocaleLoader();
      expect((loader.t as any).nonexistent).to.be.undefined;
    });
  });

  describe('Sync proxy (t)', () => {
    it('should access properties when i18next is initialized', () => {
      expect((t as any).common.back).to.be.a('string');
      expect((t as any).pages.search.heading).to.be.a('string');
    });

    it('should handle symbol access', () => {
      const symbolProp = Symbol('test');
      expect((t as any)[symbolProp]).to.be.undefined;
    });

    it('should handle nested proxy creation', () => {
      const common = (t as any).common;
      expect(common).to.be.an('object');
      expect(common.status.new).to.equal('New');
    });

    it('should fallback to file loading when i18next not ready', () => {
      const isInitializedStub = sinon.stub(i18next, 'isInitialized').value(false);
      const getResourceBundleStub = sinon.stub(i18next, 'getResourceBundle').returns({});

      expect((t as any).common).to.be.an('object');

      isInitializedStub.restore();
      getResourceBundleStub.restore();
    });

    it('should return undefined for non-existent properties in sync proxy', () => {
      // Test accessing a property that definitely doesn't exist in en.json
      // This should hit the 'return undefined' path in the sync proxy
      expect((t as any).thisPropertyDefinitelyDoesNotExist).to.be.undefined;
      expect((t as any).anotherMissingProperty).to.be.undefined;

      // Test accessing nested non-existent properties
      expect((t as any).common.thisDoesNotExist).to.be.undefined;
    });
  });

  describe('Utility functions', () => {
    it('should get locale loader singleton', async () => {
      const loader1 = await getLocaleLoader();
      const loader2 = await getLocaleLoader();
      expect(loader1).to.equal(loader2);
    });

    it('should get default locale loader', async () => {
      const loader = await getDefaultLocaleLoader();
      expect(loader).to.have.property('t');
      expect(loader).to.have.property('get');
      expect(loader).to.have.property('exists');
    });

    it('should clear locale cache', () => {
      const isInitializedStub = sinon.stub(i18next, 'isInitialized').value(true);
      clearLocaleCache();
      expect(consoleLogStub.calledWith('Locale cache cleared (using preloaded resources)')).to.be.true;
      isInitializedStub.restore();
    });

    it('should handle clearLocaleCache when not initialized', () => {
      const isInitializedStub = sinon.stub(i18next, 'isInitialized').value(false);
      clearLocaleCache();
      expect(consoleLogStub.called).to.be.false;
      isInitializedStub.restore();
    });
  });
});
