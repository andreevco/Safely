import { ReactNode, useCallback, useRef, useState } from 'react';
import { View } from 'react-native';

import { PopupMenuPortalContext } from './PopupMenuPortal.context';
import { styles } from './PopupMenuPortal.styles';

export { usePopupMenuPortal } from './PopupMenuPortal.context';

export function PopupMenuPortalHost({ children }: { children: ReactNode }) {
    const containerRef = useRef<View>(null);
    const contentRef = useRef<ReactNode>(null);
    const [visible, _setVisible] = useState(false);

    const setVisible = useCallback((v: boolean) => {
        _setVisible(v);
    }, []);

    return (
        <PopupMenuPortalContext.Provider value={{ containerRef, contentRef, setVisible }}>
            <View ref={containerRef} style={styles.container} collapsable={false}>
                {children}
                {visible && <View style={styles.overlay}>{contentRef.current}</View>}
            </View>
        </PopupMenuPortalContext.Provider>
    );
}
