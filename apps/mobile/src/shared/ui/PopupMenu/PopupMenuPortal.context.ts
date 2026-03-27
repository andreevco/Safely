import { createContext, RefObject, useContext } from 'react';
import { View } from 'react-native';

export interface PopupMenuPortalContextType {
    containerRef: RefObject<View | null>;
    contentRef: React.MutableRefObject<React.ReactNode>;
    setVisible: (visible: boolean) => void;
}

export const PopupMenuPortalContext = createContext<PopupMenuPortalContextType | null>(null);

export function usePopupMenuPortal() {
    return useContext(PopupMenuPortalContext);
}
