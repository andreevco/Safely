import { useMemo } from 'react';
import { TouchableHighlight, TouchableHighlightProps, View, ViewStyle } from 'react-native';
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

    styles.useVariants({ background });

    const contextValue = useMemo(() => ({ skeleton }), [skeleton]);

    return (
        <CellContext.Provider value={contextValue}>
            <View style={[styles.container, containerStyle]}>
                <TouchableHighlight
                    activeOpacity={1}
                    underlayColor={theme.colors.other.hover}
                    {...rest}
                >
                    <View style={[styles.content(showDivider), style]}>{children}</View>
                </TouchableHighlight>
            </View>
        </CellContext.Provider>
    );
};
