import { useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useRef } from 'react';

import { useBottomSheet } from './context';

export function useCloseOnReturn() {
    const { close } = useBottomSheet();
    const navigation = useNavigation();
    const hasNavigated = useRef(false);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            if (hasNavigated.current) {
                close();
            }
        });

        return unsubscribe;
    }, [navigation, close]);

    return useCallback(() => {
        hasNavigated.current = true;
    }, []);
}
