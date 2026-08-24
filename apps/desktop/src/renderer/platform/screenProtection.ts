import { subscribeScreenProtection } from '@safely/web-ui';

import type { DesktopBridge } from '../../shared/bridge';

export function applyScreenProtection(bridge: DesktopBridge): void {
    subscribeScreenProtection(isProtected => void bridge.setContentProtection(isProtected));
}
