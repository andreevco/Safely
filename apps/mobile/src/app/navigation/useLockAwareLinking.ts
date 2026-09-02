import type { LinkingOptions, ParamListBase } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { useEffect, useMemo, useRef } from 'react';

export function useLockAwareLinking(isLocked: boolean): LinkingOptions<ParamListBase> {
    const isLockedRef = useRef(isLocked);
    const pendingUrlRef = useRef<string | null>(null);
    const listenerRef = useRef<((url: string) => void) | null>(null);

    useEffect(() => {
        isLockedRef.current = isLocked;
    }, [isLocked]);

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
                const url = await Linking.getInitialURL();

                if (url !== null && isLockedRef.current) {
                    pendingUrlRef.current = url;

                    return null;
                }

                return url;
            },
            subscribe(listener) {
                listenerRef.current = listener;

                const subscription = Linking.addEventListener('url', ({ url }) => {
                    if (isLockedRef.current) {
                        pendingUrlRef.current = url;

                        return;
                    }

                    listener(url);
                });

                return () => {
                    listenerRef.current = null;
                    subscription.remove();
                };
            }
        }),
        []
    );
}
