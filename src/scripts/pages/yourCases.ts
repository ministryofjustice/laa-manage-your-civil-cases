/**
 * Your Cases Page Configuration
 *
 * Handles client-side functionality for the cases page using reusable utilities
 */

import { initialiseTabContent } from '../utils/tabContentManager.js';

document.addEventListener('DOMContentLoaded', function () {
    console.log('Your Cases: Page loaded');

    // Initialise tab content visibility using the generic utility
    initialiseTabContent({
        containerSelector: '#your-cases-tab-container',
        logPrefix: 'Your Cases'
    });
});
