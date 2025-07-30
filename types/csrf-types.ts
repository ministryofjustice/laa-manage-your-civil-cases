// This file contains type definitions for CSRF middleware in an Express application.
// Import csrf-sync to ensure its type extensions are loaded
import 'csrf-sync';

// Extended express-serve-static-core to include csrfToken in response.locals
declare module 'express-serve-static-core' {
	// csrfToken is already defined in Request by csrf-sync

	// Add csrfToken to Response locals
	interface Locals {
		csrfToken?: string;
	}
}
