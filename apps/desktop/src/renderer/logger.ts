import { buildWebLogger } from '@safely/web-ui';

import { platform } from './platform';

/** One per renderer: the storage adapters, the query client and the app context log through it. */
export const { logger } = buildWebLogger(platform.appInfo.environment === 'development');
