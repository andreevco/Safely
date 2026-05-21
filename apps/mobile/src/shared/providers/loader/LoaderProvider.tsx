import type { FC, PropsWithChildren } from 'react';
import React, { useCallback, useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { FullWindowOverlay } from 'react-native-screens';

import { FullScreenLoader } from '@mobile/shared/ui/FullScreenLoader';

import { useLoaderServiceContext } from './LoaderServiceProvider';

const Overlay = Platform.OS === 'ios' ? FullWindowOverlay : View;

export const LoaderProvider: FC<PropsWithChildren> = ({ children }) => {
    const { setService } = useLoaderServiceContext();
    const [isShown, setIsShown] = useState(false);

    const show = useCallback(() => setIsShown(true), []);
    const hide = useCallback(() => setIsShown(false), []);

    const withLoader = useCallback(
        async <T,>(callback: () => Promise<T>): Promise<T> => {
            try {
                show();
                await new Promise(resolve => setTimeout(resolve, 50));
                return await callback();
            } finally {
                hide();
            }
        },
        [show, hide]
    );

    useEffect(() => {
        setService({ show, hide, withLoader });
    }, [setService, show, hide, withLoader]);

    return (
        <>
            {children}
            {isShown && (
                <Overlay style={StyleSheet.absoluteFill}>
                    <FullScreenLoader visible />
                </Overlay>
            )}
        </>
    );
};
