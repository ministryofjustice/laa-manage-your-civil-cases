/**
 * HTML Entity Decoding Tests
 *
 * Tests for the decodeHTMLEntities functionality in dataTransformers
 */

import { expect } from 'chai';
import { safeString, safeOptionalString } from '#src/scripts/helpers/dataTransformers.js';

describe('HTML Entity Decoding', () => {
  describe('safeString with HTML entities', () => {
    it('should decode apostrophe entity &#39;', () => {
      const input = "O&#39;Brien";
      const result = safeString(input);
      expect(result).to.equal("O'Brien");
    });

    it('should decode apostrophe entity &apos;', () => {
      const input = "O&apos;Brien";
      const result = safeString(input);
      expect(result).to.equal("O'Brien");
    });

    it('should decode apostrophe hex entity &#x27;', () => {
      const input = "O&#x27;Brien";
      const result = safeString(input);
      expect(result).to.equal("O'Brien");
    });

    it('should decode ampersand entity &amp;', () => {
      const input = "Smith &amp; Jones";
      const result = safeString(input);
      expect(result).to.equal("Smith & Jones");
    });

    it('should decode quote entity &quot;', () => {
      const input = "Say &quot;Hello&quot;";
      const result = safeString(input);
      expect(result).to.equal('Say "Hello"');
    });

    it('should decode multiple entities in one string', () => {
      const input = "O&#39;Brien &amp; Smith";
      const result = safeString(input);
      expect(result).to.equal("O'Brien & Smith");
    });

    it('should handle strings without entities', () => {
      const input = "John Smith";
      const result = safeString(input);
      expect(result).to.equal("John Smith");
    });

    it('should handle empty strings', () => {
      const input = "";
      const result = safeString(input);
      expect(result).to.equal("");
    });

    it('should handle null values', () => {
      const result = safeString(null);
      expect(result).to.equal("");
    });

    it('should handle undefined values', () => {
      const result = safeString(undefined);
      expect(result).to.equal("");
    });
  });

  describe('safeOptionalString with HTML entities', () => {
    it('should decode apostrophe entity &#39;', () => {
      const input = "O&#39;Brien";
      const result = safeOptionalString(input);
      expect(result).to.equal("O'Brien");
    });

    it('should return undefined for null', () => {
      const result = safeOptionalString(null);
      expect(result).to.be.undefined;
    });

    it('should return undefined for undefined', () => {
      const result = safeOptionalString(undefined);
      expect(result).to.be.undefined;
    });
  });
});
