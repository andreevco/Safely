import type { LinkingOptions, ParamListBase } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { useEffect, useMemo, useRef } from 'react';

export function useLockAwareLinking(isLocked: boolean): LinkingOptions<ParamListBase> {
    const pendingUrlRef = useRef<string | null>(null);
    const listenerRef = useRef<((url: string) => void) | null>(null);
    const isLockedRef = useRef(isLocked);
    const hasConsumedInitialUrlRef = useRef(false);

    useEffect(() => {
        isLockedRef.current = isLocked;
    }, [isLocked]);

    useEffect(() => {
        const subscription = Linking.addEventListener('url', ({ url }) => {
            const listener = listenerRef.current;

            if (isLockedRef.current || listener === null) {
                pendingUrlRef.current = url;

                return;
            }

            listener(url);
        });

        return () => subscription.remove();
    }, []);

    useEffect(() => {
        if (isLocked) {
            return;
        }

        const url = pendingUrlRef.current;
        const listener = listenerRef.current;

        if (url === null || listener === null) {
            return;
        }

        pendingUrlRef.current = null;
        listener(url);
    }, [isLocked]);

    return useMemo(
        () => ({
            enabled: true,
            prefixes: [Linking.createURL('/')],
            async getInitialURL() {
                const pendingUrl = pendingUrlRef.current;

                if (pendingUrl !== null) {
                    pendingUrlRef.current = null;

                    return pendingUrl;
                }

                if (hasConsumedInitialUrlRef.current) {
                    return null;
                }

                hasConsumedInitialUrlRef.current = true;

                return await Linking.getInitialURL();
            },
            subscribe(listener) {
                listenerRef.current = listener;

                const url = pendingUrlRef.current;

                if (url !== null && !isLockedRef.current) {
                    pendingUrlRef.current = null;
                    listener(url);
                }

                return () => {
                    listenerRef.current = null;
                };
            }
        }),
        []
    );
}
