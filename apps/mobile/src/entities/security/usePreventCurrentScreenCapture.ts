import { useRoute } from '@react-navigation/native';
import { allowScreenCaptureAsync, preventScreenCaptureAsync } from 'expo-screen-capture';
import { useEffect } from 'react';
import { Platform } from 'react-native';

/**
 * hate react-navigation. There is no elegant way to relay, is screen closed and
 * is not visible for user. We need a magic constant to be sure
 * that closing animation is finished on iOS 🤡
 * https://github.com/react-navigation/react-navigation/issues/12672
 */
const TRANSITION_END_DELAY_MS = 1000;

export const usePreventCurrentScreenCapture = () => {
    const { key } = useRoute();

    useEffect(() => {
        // On iOS current way causes issues with react-navigation on iOS, Android is fine
        if (Platform.OS !== 'android') return;

        void preventScreenCaptureAsync(key);

        return () => {
            setTimeout(() => {
                void allowScreenCaptureAsync(key);
            }, TRANSITION_END_DELAY_MS);
        };
    }, [key]);
};
