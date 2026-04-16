import Color from 'color';
import { setStringAsync } from 'expo-clipboard';
import { notificationAsync, NotificationFeedbackType } from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity, View, ViewStyle } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSequence,
    withTiming
} from 'react-native-reanimated';
import { useUnistyles } from 'react-native-unistyles';

import { Text } from '@mobile/shared/ui/Text';

import { styles } from './TableCell.styles';

type TableCellChildrenRenderProps = {
    handleCopy: () => void;
};

export type TableCellContainerProps = {
    children: React.ReactNode | ((props: TableCellChildrenRenderProps) => React.ReactNode);
    style?: ViewStyle;
    showDivider?: boolean;
    copyable?: string;
};

const COPIED_BACKGROUND_FADE_IN_DURATION = 180;
const COPIED_TEXT_FADE_IN_DURATION = 200;
const COPIED_VISIBLE_DURATION = 800;
const COPIED_FADE_OUT_DURATION = 200;

export const TableCellContainer = (props: TableCellContainerProps) => {
    const { children, style, showDivider = true, copyable } = props;

    const { t } = useTranslation();

    styles.useVariants({ showDivider });

    const theme = useUnistyles().theme;

    const copiedOpacity = useSharedValue(0);
    const copiedBackgroundOpacity = useSharedValue(0);

    const copiedStyle = useAnimatedStyle(() => ({
        opacity: copiedOpacity.value
    }));

    const copiedBackgroundStyle = useAnimatedStyle(() => ({
        opacity: copiedBackgroundOpacity.value
    }));

    const handleCopy = useCallback(() => {
        if (copyable == null) return;
        void setStringAsync(copyable);
        void notificationAsync(NotificationFeedbackType.Success);

        copiedBackgroundOpacity.value = withSequence(
            withTiming(1, {
                duration: COPIED_BACKGROUND_FADE_IN_DURATION,
                easing: Easing.in(Easing.ease)
            }),
            withDelay(
                COPIED_TEXT_FADE_IN_DURATION + COPIED_VISIBLE_DURATION,
                withTiming(0, {
                    duration: COPIED_FADE_OUT_DURATION,
                    easing: Easing.out(Easing.ease)
                })
            )
        );

        copiedOpacity.value = withDelay(
            COPIED_BACKGROUND_FADE_IN_DURATION,
            withSequence(
                withTiming(1, {
                    duration: COPIED_TEXT_FADE_IN_DURATION,
                    easing: Easing.in(Easing.ease)
                }),
                withDelay(
                    COPIED_VISIBLE_DURATION,
                    withTiming(0, {
                        duration: COPIED_FADE_OUT_DURATION,
                        easing: Easing.out(Easing.ease)
                    })
                )
            )
        );
    }, [copyable, copiedOpacity, copiedBackgroundOpacity]);

    return (
        <TouchableOpacity
            activeOpacity={1}
            style={[styles.container, style]}
            onPress={handleCopy}
            disabled={!copyable}
        >
            {typeof children === 'function' ? children({ handleCopy }) : children}
            {copyable != null && (
                <View pointerEvents="none" style={[styles.copiedIndicator]}>
                    <Animated.View style={[styles.copiedAbsoluteContainer, copiedBackgroundStyle]}>
                        <LinearGradient
                            colors={[
                                new Color(theme.colors.background.secondary).alpha(0).toString(),
                                theme.colors.background.secondary
                            ]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.copiedIndicatorGradient}
                        ></LinearGradient>
                        <View style={styles.copiedIndicatorBackground} />
                    </Animated.View>
                    <Animated.View style={copiedStyle}>
                        <Text variant="labelM">{t('actions.copied')}</Text>
                    </Animated.View>
                </View>
            )}
        </TouchableOpacity>
    );
};
