import { useEffect, useState } from 'react';

export function useIsFullScreen(): boolean {
    const [isFullScreen, setIsFullScreen] = useState(false);

    useEffect(() => {
        const bridge = window.safelyDesktop;

        if (!bridge) {
            return;
        }

        void bridge.isFullScreen().then(setIsFullScreen);

        return bridge.onFullScreenChange(setIsFullScreen);
    }, []);

    return isFullScreen;
}
