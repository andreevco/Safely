import Color from 'color';
import { setStringAsync } from 'expo-clipboard';
import { notificationAsync, NotificationFeedbackType } from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Children, Fragment, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { ViewStyle } from 'react-native';
import { TouchableOpacity, View } from 'react-native';
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
    rowDivider?: boolean;
    columnDivider?: boolean;
    copyable?: string;
};

const COPIED_FADE_IN_DURATION = 180;
const COPIED_VISIBLE_DURATION = 800;

export const TableCellContainer = (props: TableCellContainerProps) => {
    const { children, style, rowDivider = true, columnDivider = false, copyable } = props;

    const { t } = useTranslation();

    styles.useVariants({ rowDivider });

    const theme = useUnistyles().theme;

    const copiedOpacity = useSharedValue(0);

    const copiedStyle = useAnimatedStyle(() => ({
        opacity: copiedOpacity.value
    }));

    const handleCopy = useCallback(() => {
        if (copyable == null) return;
        void setStringAsync(copyable);
        void notificationAsync(NotificationFeedbackType.Success);

        copiedOpacity.value = withSequence(
            withTiming(1, {
                duration: COPIED_FADE_IN_DURATION,
                easing: Easing.in(Easing.ease)
            }),
            withDelay(
                COPIED_VISIBLE_DURATION,
                withTiming(0, {
                    duration: COPIED_FADE_IN_DURATION,
                    easing: Easing.out(Easing.ease)
                })
            )
        );
    }, [copyable, copiedOpacity]);

    let content: ReactNode;
    if (typeof children === 'function') {
        content = children({ handleCopy });
    } else if (columnDivider) {
        content = Children.toArray(children).map((child, index) => (
            <Fragment key={index}>
                {index > 0 && <View style={styles.columnDivider} />}
                {child}
            </Fragment>
        ));
    } else {
        content = children;
    }

    return (
        <TouchableOpacity
            activeOpacity={1}
            style={[styles.container, style]}
            onPress={handleCopy}
            disabled={!copyable}
        >
            {content}
            {copyable != null && (
                <Animated.View pointerEvents="none" style={[styles.copiedIndicator, copiedStyle]}>
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
                    <Text variant="labelM">{t('actions.copied')}</Text>
                </Animated.View>
            )}
        </TouchableOpacity>
    );
};
