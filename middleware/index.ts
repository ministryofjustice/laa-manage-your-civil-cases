import { setupMiddlewares } from '#middleware/commonMiddleware.js';
import { setupCsrf } from '#middleware/setupCsrf.js';
import { setupConfig } from '#middleware/setupConfigs.js';
import { setupLocaleMiddleware } from '#middleware/setupLocale.js';

export { setupMiddlewares, setupCsrf, setupConfig, setupLocaleMiddleware };