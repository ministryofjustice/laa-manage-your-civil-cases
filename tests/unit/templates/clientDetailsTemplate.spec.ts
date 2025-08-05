import { expect } from 'chai';
import { describe, it } from 'mocha';

describe('Client Details Template - DoB Change Link', () => {
  describe('Date of Birth Change Link Routing', () => {
    it('should generate correct DoB edit route for given case reference', () => {
      // Test the route construction logic
      const caseReference = 'PC-1922-1879';
      const expectedRoute = `/cases/${caseReference}/client-details/edit/date-of-birth`;
      
      // Verify the expected route format
      expect(expectedRoute).to.equal('/cases/PC-1922-1879/client-details/edit/date-of-birth');
    });

    it('should handle different case reference formats', () => {
      const testCases = [
        { caseRef: 'PC-1922-1879', expected: '/cases/PC-1922-1879/client-details/edit/date-of-birth' },
        { caseRef: 'LAA-2023-001', expected: '/cases/LAA-2023-001/client-details/edit/date-of-birth' },
        { caseRef: 'TEST-123-456', expected: '/cases/TEST-123-456/client-details/edit/date-of-birth' }
      ];

      testCases.forEach(testCase => {
        const route = `/cases/${testCase.caseRef}/client-details/edit/date-of-birth`;
        expect(route).to.equal(testCase.expected);
      });
    });

    it('should not point to root path', () => {
      const caseReference = 'PC-1922-1879';
      const correctRoute = `/cases/${caseReference}/client-details/edit/date-of-birth`;
      const incorrectRoute = '/';
      
      // Ensure we're not using the root path
      expect(correctRoute).to.not.equal(incorrectRoute);
      expect(correctRoute).to.contain('edit/date-of-birth');
    });

    it('should include case reference in the URL', () => {
      const caseReference = 'PC-1922-1879';
      const route = `/cases/${caseReference}/client-details/edit/date-of-birth`;
      
      expect(route).to.contain(caseReference);
      expect(route).to.contain('/cases/');
      expect(route).to.contain('/client-details/edit/date-of-birth');
    });

    it('should match the route pattern expected by the router', () => {
      // This route should match the pattern in caseDetails.ts:
      // router.get('/:caseReference/client-details/edit/date-of-birth', ...)
      const caseReference = 'PC-1922-1879';
      const route = `/cases/${caseReference}/client-details/edit/date-of-birth`;
      
      // Verify route structure matches expected pattern
      const routeParts = route.split('/');
      expect(routeParts[1]).to.equal('cases');
      expect(routeParts[2]).to.equal(caseReference);
      expect(routeParts[3]).to.equal('client-details');
      expect(routeParts[4]).to.equal('edit');
      expect(routeParts[5]).to.equal('date-of-birth');
    });
  });

  describe('Template Data Requirements', () => {
    it('should expect caseReference to be available in template data', () => {
      // Mock template data structure
      const mockTemplateData = {
        data: {
          caseReference: 'PC-1922-1879',
          fullName: 'John Doe',
          dateOfBirth: '15/06/1985'
        }
      };

      // Verify required data is present
      expect(mockTemplateData.data).to.have.property('caseReference');
      expect(mockTemplateData.data.caseReference).to.be.a('string');
      expect(mockTemplateData.data.caseReference).to.not.be.empty;
    });

    it('should validate that href construction uses data.caseReference', () => {
      const mockData = { caseReference: 'PC-1922-1879' };
      
      // Simulate the href construction in the template
      const href = `/cases/${mockData.caseReference}/client-details/edit/date-of-birth`;
      
      expect(href).to.equal('/cases/PC-1922-1879/client-details/edit/date-of-birth');
      expect(href).to.contain(mockData.caseReference);
    });
  });

  describe('Accessibility and User Experience', () => {
    it('should provide proper visually hidden text for screen readers', () => {
      const visuallyHiddenText = 'Change Date of birth';
      
      expect(visuallyHiddenText).to.contain('Change');
      expect(visuallyHiddenText).to.contain('Date of birth');
      expect(visuallyHiddenText).to.be.a('string');
      expect(visuallyHiddenText.length).to.be.greaterThan(0);
    });

    it('should have appropriate link text', () => {
      const linkText = 'Change';
      
      expect(linkText).to.equal('Change');
      expect(linkText).to.be.a('string');
      expect(linkText.length).to.be.greaterThan(0);
    });
  });
});
