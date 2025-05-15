import { setupMiddlewares } from '#middleware/commonMiddleware.js';
import { setupCsrf } from '#middleware/setupCsrf.js';
import { setupConfig } from '#middleware/setupConfigs.js';
import { setupDB } from '#middleware/setupDB.js';

export { setupMiddlewares, setupCsrf, setupConfig, setupDB };