import { setStringAsync } from 'expo-clipboard';
import { notificationAsync, NotificationFeedbackType } from 'expo-haptics';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { ellipsisMiddle } from '@safely/core';

import { Text } from '@mobile/shared/ui';

import { SubtitleStatus, useSubtitleStatus } from './useSubtitleStatus';

interface SubtitleProps {
    address: string;
    isFetching: boolean;
}

export const Subtitle = ({ address, isFetching }: SubtitleProps) => {
    const { t } = useTranslation();

    const { status, onCopyAddress } = useSubtitleStatus({ isFetching });

    const handleCopyAddress = useCallback(() => {
        setStringAsync(address);
        notificationAsync(NotificationFeedbackType.Success);
        onCopyAddress();
    }, [onCopyAddress, address]);

    const content = useMemo(() => {
        switch (status) {
            case SubtitleStatus.ADDRESS:
                return (
                    <Text
                        onPress={handleCopyAddress}
                        textAlign="center"
                        variant="bodyL"
                        color="secondary"
                    >
                        {ellipsisMiddle(address, 4)}
                    </Text>
                );
            case SubtitleStatus.ADDRESS_COPIED:
                return (
                    <Text variant="bodyL" textAlign="center" color="secondary">
                        {t('home.status.addressCopied')}
                    </Text>
                );
            case SubtitleStatus.UPDATING:
                return (
                    <Text variant="bodyL" textAlign="center" color="secondary">
                        {t('home.status.updating')}
                    </Text>
                );
            case SubtitleStatus.NO_INTERNET:
                return (
                    <Text variant="bodyL" textAlign="center" color="accentOrange">
                        {t('home.status.noInternet')}
                    </Text>
                );
        }
    }, [status, t, handleCopyAddress, address]);

    return (
        <Animated.View
            key={status}
            entering={FadeIn.duration(200).delay(220)}
            exiting={FadeOut.duration(180)}
        >
            {content}
        </Animated.View>
    );
};
