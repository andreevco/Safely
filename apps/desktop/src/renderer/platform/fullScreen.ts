import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';

import type { DesktopBridge } from '../../shared/bridge';

const fullScreenStore = createStore<boolean>(() => false);

export function subscribeFullScreen(bridge: DesktopBridge): void {
    void bridge.isFullScreen().then(isFullScreen => fullScreenStore.setState(isFullScreen));

    bridge.onFullScreenChange(isFullScreen => fullScreenStore.setState(isFullScreen));
}

export function useIsFullScreen(): boolean {
    return useStore(fullScreenStore);
}
