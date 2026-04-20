import { useMemo } from 'react';
import { TouchableHighlight, TouchableHighlightProps, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { UnistylesVariants, useUnistyles } from 'react-native-unistyles';

import { styles } from './Cell.styles';
import { CellContext } from './CellContext';

export type CellContainerProps = TouchableHighlightProps &
    UnistylesVariants<typeof styles> & {
        skeleton?: boolean;
        containerStyle?: ViewStyle;
        showDivider?: boolean;
    };

export const CellContainer = (props: CellContainerProps) => {
    const {
        children,
        style,
        skeleton,
        containerStyle,
        background = 'secondary',
        showDivider = true,
        ...rest
    } = props;
    const theme = useUnistyles().theme;
    const isPressing = useSharedValue(false);

    styles.useVariants({ background });

    const contextValue = useMemo(() => ({ skeleton }), [skeleton]);

    const animatedStyle = useAnimatedStyle(() => ({
        borderBottomColor: isPressing.value ? 'transparent' : theme.colors.other.transparentElement
    }));

    return (
        <CellContext.Provider value={contextValue}>
            <View style={[styles.container, containerStyle]}>
                <TouchableHighlight
                    underlayColor={theme.colors.other.hover}
                    onPressIn={() => (isPressing.value = true)}
                    onPressOut={() => (isPressing.value = false)}
                    {...rest}
                >
                    <Animated.View style={[styles.content(showDivider), animatedStyle, style]}>
                        {children}
                    </Animated.View>
                </TouchableHighlight>
            </View>
        </CellContext.Provider>
    );
};
