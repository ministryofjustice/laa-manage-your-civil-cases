// Import GOV.UK Frontend
import { initAll as initGOVUK } from "govuk-frontend";

// Import MOJ Frontend
import { initAll as initMOJ } from "@ministryofjustice/frontend";

// Initialize both frontend packages
if (typeof window !== 'undefined') {
    console.log('Initializing GOV.UK Frontend...');
    initGOVUK();

    console.log('Initializing MOJ Frontend...');
    initMOJ();

    console.log('Frontend packages loaded and initialized');
}
