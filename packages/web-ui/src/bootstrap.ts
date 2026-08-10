/**
 * `import '@safely/web-ui/bootstrap'` must be the **first** import of an app entry: ES imports
 * are evaluated before the importing module's body, and the Ledger SDK reads `Buffer` while
 * being evaluated. For the same reason this file bypasses the `shared/platform` barrel, which
 * would pull `@safely/ux` above the install call.
 */
import { installWebGlobals } from './shared/platform/globals';

installWebGlobals();
