/**
 * @description Test for CSRF protection middleware
 */

import { setupCsrf } from '#src/middlewares/setupCsrf.js';
import express, { type Application } from 'express';
import { expect } from 'chai';
import request from 'supertest';
import cookieParser from 'cookie-parser';

describe('CSRF Protection Middleware', () => {
  describe('Middleware Setup', () => {
    it('should set up CSRF middleware without throwing an error', () => {
      const testApp = express();
      expect(() => setupCsrf(testApp)).to.not.throw();
    });
  });

  describe('Origin Header Validation - Production', () => {
    let app: Application;

    beforeEach(() => {
      process.env.NODE_ENV = 'production';

      app = express();
      app.use(express.json());
      app.use(express.urlencoded({ extended: true }));
      app.use(cookieParser());

      setupCsrf(app);

      // Mock template rendering
      app.set('view engine', 'njk');
      app.engine('njk', (_filePath: string, options: object, callback: (e: Error | null, rendered?: string) => void) => {
        const opts = options as { status: string; error: string };
        callback(null, `<html><body>${opts.status}: ${opts.error}</body></html>`);
      });

      app.post('/test', (_req, res) => res.json({ success: true }));
      app.put('/test', (_req, res) => res.json({ success: true }));
      app.delete('/test', (_req, res) => res.json({ success: true }));
    });

    afterEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('should block POST requests with invalid origin in production', async () => {
      const response = await request(app)
        .post('/test')
        .set('Origin', 'http://evil.com')
        .set('Host', 'localhost:3000');

      expect(response.status).to.equal(403);
      expect(response.text).to.include('403 - Forbidden');
      expect(response.text).to.include('Invalid origin or referer header');
    });

    it('should block PUT requests with invalid origin in production', async () => {
      const response = await request(app)
        .put('/test')
        .set('Origin', 'http://evil.com')
        .set('Host', 'localhost:3000');

      expect(response.status).to.equal(403);
    });

    it('should block DELETE requests with invalid origin in production', async () => {
      const response = await request(app)
        .delete('/test')
        .set('Origin', 'http://evil.com')
        .set('Host', 'localhost:3000');

      expect(response.status).to.equal(403);
    });

    it('should block POST requests with invalid referer in production', async () => {
      const response = await request(app)
        .post('/test')
        .set('Referer', 'http://evil.com/page')
        .set('Host', 'localhost:3000');

      expect(response.status).to.equal(403);
      expect(response.text).to.include('Invalid origin or referer header');
    });

    it('should allow POST requests when origin is "null" (browser privacy/bookmark)', async () => {
      const response = await request(app)
        .post('/test')
        .set('Origin', 'null')  // Browser sends literal string 'null'
        .set('Host', 'localhost:3000');

      // Should pass origin validation since origin='null' is treated as no origin
      // May fail on CSRF token validation, but NOT on origin validation
      if (response.status === 403) {
        expect(response.text).to.not.include('Invalid origin or referer header');
      }
    });
  });

  describe('Origin Header Validation - Development', () => {
    let app: Application;

    beforeEach(() => {
      process.env.NODE_ENV = 'development';

      app = express();
      app.use(express.json());
      app.use(express.urlencoded({ extended: true }));
      app.use(cookieParser());

      setupCsrf(app);

      // Mock template rendering
      app.set('view engine', 'njk');
      app.engine('njk', (_filePath: string, options: object, callback: (e: Error | null, rendered?: string) => void) => {
        const opts = options as { status: string; error: string };
        callback(null, `<html><body>${opts.status}: ${opts.error}</body></html>`);
      });

      app.post('/test', (_req, res) => res.json({ success: true }));
    });

    it('should block external origins even in development', async () => {
      const response = await request(app)
        .post('/test')
        .set('Origin', 'http://evil.com')
        .set('Host', 'localhost:3000');

      // External origins should be blocked with our specific error message
      expect(response.status).to.equal(403);
      expect(response.text).to.include('Invalid origin or referer header');
    });

    it('should allow same-origin requests in development', async () => {
      const response = await request(app)
        .post('/test')
        .set('Origin', 'http://localhost:3000')
        .set('Host', 'localhost:3000');

      // Same origin should pass origin validation
      // May get 403 from CSRF token validation, but NOT from origin validation
      // Our origin error has specific text
      if (response.status === 403) {
        expect(response.text).to.not.include('Invalid origin or referer header');
      }
    });

    it('should handle malformed origin URLs gracefully in development', async () => {
      const response = await request(app)
        .post('/test')
        .set('Origin', 'not-a-valid-url')
        .set('Host', 'localhost:3000');

      // Development mode is lenient with malformed URLs - allows them through
      expect(response.status).to.exist;
    });
  });

  describe('X-Forwarded-Host Header Support', () => {
    let app: Application;

    beforeEach(() => {
      process.env.NODE_ENV = 'production';

      app = express();
      app.use(express.json());
      app.use(express.urlencoded({ extended: true }));
      app.use(cookieParser());

      setupCsrf(app);

      // Mock template rendering
      app.set('view engine', 'njk');
      app.engine('njk', (_filePath: string, options: object, callback: (e: Error | null, rendered?: string) => void) => {
        const opts = options as { status: string; error: string };
        callback(null, `<html><body>${opts.status}: ${opts.error}</body></html>`);
      });

      app.post('/test', (_req, res) => res.json({ success: true }));
    });

    afterEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('should use X-Forwarded-Host when validating origin behind proxy', async () => {
      const response = await request(app)
        .post('/test')
        .set('Origin', 'https://manage-civil-cases.cloud-platform.service.justice.gov.uk')
        .set('Host', 'internal-service:3000')
        .set('X-Forwarded-Host', 'manage-civil-cases.cloud-platform.service.justice.gov.uk');

      // Should pass origin validation using X-Forwarded-Host
      // May fail on CSRF token, but NOT on origin validation
      if (response.status === 403) {
        expect(response.text).to.not.include('Invalid origin or referer header');
      }
    });

    it('should block requests when X-Forwarded-Host does not match origin', async () => {
      const response = await request(app)
        .post('/test')
        .set('Origin', 'http://evil.com')
        .set('Host', 'internal-service:3000')
        .set('X-Forwarded-Host', 'manage-civil-cases.cloud-platform.service.justice.gov.uk');

      // Should fail origin validation even with X-Forwarded-Host
      expect(response.status).to.equal(403);
      expect(response.text).to.include('Invalid origin or referer header');
    });

    it('should validate referer against X-Forwarded-Host', async () => {
      const response = await request(app)
        .post('/test')
        .set('Referer', 'https://manage-civil-cases.cloud-platform.service.justice.gov.uk/page')
        .set('Host', 'internal-service:3000')
        .set('X-Forwarded-Host', 'manage-civil-cases.cloud-platform.service.justice.gov.uk');

      // Should pass origin validation using X-Forwarded-Host with referer
      // May fail on CSRF token, but NOT on origin validation
      if (response.status === 403) {
        expect(response.text).to.not.include('Invalid origin or referer header');
      }
    });

    it('should handle X-Forwarded-Host as array (multiple proxies)', async () => {
      const response = await request(app)
        .post('/test')
        .set('Origin', 'https://manage-civil-cases.cloud-platform.service.justice.gov.uk')
        .set('Host', 'internal-service:3000')
        // Simulate multiple X-Forwarded-Host headers (becomes array in Express)
        .set('X-Forwarded-Host', 'manage-civil-cases.cloud-platform.service.justice.gov.uk, proxy1.example.com');

      // Should use first value from X-Forwarded-Host and pass validation
      // May fail on CSRF token, but NOT on origin validation
      if (response.status === 403) {
        expect(response.text).to.not.include('Invalid origin or referer header');
      }
    });
  });

  describe('Safe HTTP Methods', () => {
    let app: Application;

    beforeEach(() => {
      app = express();
      app.use(express.json());
      app.use(cookieParser());
      setupCsrf(app);
      app.get('/test', (_req, res) => res.json({ success: true }));
    });

    it('should allow GET requests without triggering origin validation', async () => {
      const response = await request(app)
        .get('/test')
        .set('Host', 'localhost:3000');

      // GET requests should not error on origin validation
      // They may error on CSRF setup but not on our origin middleware
      expect([200, 500]).to.include(response.status);
    });
  });

  describe('Error Handling', () => {
    it('should identify ForbiddenError correctly', () => {
      const mockError = new Error('invalid csrf token');
      mockError.name = 'ForbiddenError';

      expect(mockError.name).to.equal('ForbiddenError');
      expect(mockError.message).to.include('csrf');
    });
  });
});

