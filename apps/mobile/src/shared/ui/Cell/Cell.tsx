import { useMemo } from 'react';
import { TouchableHighlight, TouchableHighlightProps, View } from 'react-native';
import { useUnistyles } from 'react-native-unistyles';

import { styles } from './Cell.styles';
import { CellContext } from './CellContext';

export type CellContainerProps = TouchableHighlightProps & {
    skeleton?: boolean;
};

export const CellContainer = (props: CellContainerProps) => {
    const { children, style, skeleton, ...rest } = props;

    const theme = useUnistyles().theme;

    const contextValue = useMemo(() => ({ skeleton }), [skeleton]);

    return (
        <CellContext.Provider value={contextValue}>
            <TouchableHighlight underlayColor={theme.colors.other.hover} {...rest}>
                <View style={[styles.container, style]}>{children}</View>
            </TouchableHighlight>
        </CellContext.Provider>
    );
};
