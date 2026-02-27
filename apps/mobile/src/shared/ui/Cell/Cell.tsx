import { useMemo } from 'react';
import { TouchableHighlight, TouchableHighlightProps, View, ViewStyle } from 'react-native';
import { useUnistyles } from 'react-native-unistyles';

import { styles } from './Cell.styles';
import { CellContext } from './CellContext';

export type CellContainerProps = TouchableHighlightProps & {
    skeleton?: boolean;
    containerStyle?: ViewStyle;
};

export const CellContainer = (props: CellContainerProps) => {
    const { children, style, skeleton, containerStyle, ...rest } = props;

    const theme = useUnistyles().theme;

    const contextValue = useMemo(() => ({ skeleton }), [skeleton]);

    return (
        <CellContext.Provider value={contextValue}>
            <TouchableHighlight
                underlayColor={theme.colors.other.hover}
                style={containerStyle}
                {...rest}
            >
                <View style={[styles.container, style]}>{children}</View>
            </TouchableHighlight>
        </CellContext.Provider>
    );
};
