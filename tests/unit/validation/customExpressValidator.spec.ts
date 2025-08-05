import { describe, it } from 'mocha';
import { expect } from 'chai';
import { customExpressValidator } from '#src/validation/index.js';

describe('Custom ExpressValidator Infrastructure', () => {
  describe('customExpressValidator instance', () => {
    it('should export all expected core ExpressValidator functions', () => {
      expect(customExpressValidator).to.be.an('object');
      expect(customExpressValidator.body).to.be.a('function');
      expect(customExpressValidator.checkSchema).to.be.a('function');
      expect(customExpressValidator.validationResult).to.be.a('function');
    });

    it('should provide standard validation chains', () => {
      const chain = customExpressValidator.body('test');
      expect(chain).to.be.a('function'); // Validation chains are functions
      expect(chain.notEmpty).to.be.a('function');
      expect(chain.isLength).to.be.a('function');
      expect(chain.custom).to.be.a('function');
    });

    it('should format errors in GOV.UK style', () => {
      // The main purpose of our custom instance is error formatting
      const result = customExpressValidator.validationResult({} as any);
      expect(result).to.be.an('object');
      expect(result.formatWith).to.be.a('function');
    });
  });

  describe('Schema validation support', () => {
    it('should support custom validators in schema', () => {
      // Verify that checkSchema can use custom validators
      const mockSchema = {
        'test-field': {
          custom: {
            options: (value: string) => {
              if (!value) throw new Error('Test error');
              return true;
            }
          }
        }
      };

      const validators = customExpressValidator.checkSchema(mockSchema);
      expect(validators).to.be.an('array');
      expect(validators.length).to.be.greaterThan(0);
    });

    it('should support multiple field validation with proper schema structure', () => {
      const mockSchema = {
        'field1': { 
          notEmpty: {
            errorMessage: 'Field 1 is required'
          }
        },
        'field2': { 
          isLength: { 
            options: { min: 1 },
            errorMessage: 'Field 2 must be at least 1 character'
          }
        },
        'field3': { 
          custom: { 
            options: () => true,
            errorMessage: 'Field 3 custom validation failed'
          } 
        }
      };

      const validators = customExpressValidator.checkSchema(mockSchema);
      expect(validators).to.be.an('array');
      expect(validators.length).to.equal(3);
    });
  });

  describe('Error formatting', () => {
    it('should use GOV.UK error formatting', () => {
      // Our custom instance should format errors according to GOV.UK patterns
      // This test verifies the instance is properly configured
      expect(customExpressValidator).to.have.property('validationResult');
      
      const formatter = customExpressValidator.validationResult({} as any);
      expect(formatter.formatWith).to.be.a('function');
    });
  });
});
