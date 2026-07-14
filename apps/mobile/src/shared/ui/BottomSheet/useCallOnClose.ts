import { useNavigation } from '@react-navigation/core';
import { useCallback, useEffect, useRef } from 'react';

import { useBottomSheet } from './context';

export function useCallOnClose() {
    const { close } = useBottomSheet();
    const navigation = useNavigation();
    const unsubscribeRef = useRef<(() => void) | null>(null);

    useEffect(
        () => () => {
            unsubscribeRef.current?.();
            unsubscribeRef.current = null;
        },
        []
    );

    return useCallback(
        (navigate: () => void) => {
            if (unsubscribeRef.current) {
                close();
                return;
            }

            unsubscribeRef.current = navigation.addListener('beforeRemove', () => {
                unsubscribeRef.current?.();
                unsubscribeRef.current = null;
                requestAnimationFrame(navigate);
            });

            close();
        },
        [close, navigation]
    );
}
