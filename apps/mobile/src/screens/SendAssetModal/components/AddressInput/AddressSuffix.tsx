import { useCallback } from 'react';
import type { TextLayoutEvent } from 'react-native';
import { Platform, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useUnistyles } from 'react-native-unistyles';

import type { ContactMeta, PortfolioMeta } from '@safely/core';

import { ContactName } from '@mobile/entities/contact';
import { PortfolioName } from '@mobile/entities/portfolio';

import { styles } from './AddressInput.styles';

interface AddressSuffixProps {
    value: string;
    portfolioMeta?: PortfolioMeta;
    contactMeta?: ContactMeta;
}

/**
 * We are using invisible Text to measure pos of suffix
 * I guess it's better approach for maintainability than yet another (3rd...) native input
 */
export const AddressSuffix = ({ value, portfolioMeta, contactMeta }: AddressSuffixProps) => {
    const { theme } = useUnistyles();
    const suffixPos = useSharedValue({ top: 0, left: 0 });

    const handleTextLayout = useCallback(
        (e: TextLayoutEvent) => {
            const lines = e.nativeEvent.lines;
            if (lines.length === 0) {
                suffixPos.value = { top: 0, left: 0 };
                return;
            }
            const last = lines[lines.length - 1];
            const gap = Platform.OS === 'android' ? theme.spacing[16] : theme.spacing[8];
            suffixPos.value = {
                top: last.y,
                left: last.x + last.width + gap
            };
        },
        [suffixPos, theme]
    );

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: suffixPos.value.top }, { translateX: suffixPos.value.left }]
    }));

    return (
        <>
            <Text style={[styles.input, styles.measure]} onTextLayout={handleTextLayout}>
                {value}
            </Text>
            <Animated.View pointerEvents="none" style={[styles.inputSuffix, animatedStyle]}>
                {portfolioMeta ? (
                    <PortfolioName
                        gap={8}
                        meta={portfolioMeta}
                        size={16}
                        fontVariant="bodyL"
                        color="tertiary"
                    />
                ) : (
                    contactMeta && (
                        <ContactName
                            gap={8}
                            meta={contactMeta}
                            size={16}
                            fontVariant="bodyL"
                            color="tertiary"
                        />
                    )
                )}
            </Animated.View>
        </>
    );
};
