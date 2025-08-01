/**
 * Edit Date of Birth Route Tests
 * 
 * Simple tests for the date of birth route configuration to boost function coverage.
 * These test the route setup without complex mocking.
 */

import { describe, it } from 'mocha';
import { expect } from 'chai';
import express from 'express';

describe('Edit Date of Birth Routes', () => {
  describe('Route Configuration', () => {
    it('should export a valid Express router', async () => {
      // Import the route module
      const routeModule = await import('../../../routes/editDateOfBirth.js');
      
      // Verify it exports a router
      expect(routeModule.default).to.exist;
      expect(typeof routeModule.default).to.equal('function');
      
      // Verify it has router-like properties
      expect(routeModule.default.stack).to.exist;
    });

    it('should have GET route configured', async () => {
      const routeModule = await import('../../../routes/editDateOfBirth.js');
      const router = routeModule.default;
      
      // Check that routes are configured
      expect(router.stack).to.have.length.greaterThan(0);
      
      // Find GET route
      const getRoute = router.stack.find((layer: any) => 
        layer.route && layer.route.methods.get
      );
      
      expect(getRoute).to.exist;
      expect(getRoute?.route?.path).to.equal('/:caseReference/client-details/edit/date-of-birth');
    });

    it('should have POST route configured with validation middleware', async () => {
      const routeModule = await import('../../../routes/editDateOfBirth.js');
      const router = routeModule.default;
      
      // Find POST route
      const postRoute = router.stack.find((layer: any) => 
        layer.route && layer.route.methods.post
      );
      
      expect(postRoute).to.exist;
      expect(postRoute?.route?.path).to.equal('/:caseReference/client-details/edit/date-of-birth');
      
      // POST route should have multiple handlers (validation middleware + controller)
      expect(postRoute?.route?.stack.length).to.be.greaterThan(1);
    });

    it('should be mountable on an Express app', async () => {
      const routeModule = await import('../../../routes/editDateOfBirth.js');
      const router = routeModule.default;
      
      // Test that it can be mounted (this exercises the export)
      const app = express();
      
      // This should not throw
      expect(() => {
        app.use('/cases', router);
      }).to.not.throw();
      
      // Verify the router is valid
      expect(router).to.exist;
      expect(typeof router).to.equal('function');
    });
  });
});
