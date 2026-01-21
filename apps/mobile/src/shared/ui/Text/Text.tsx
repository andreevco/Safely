import { Text as RNText, TextProps as RNTextProps } from 'react-native';
import { UnistylesVariants } from 'react-native-unistyles';

import { styles } from './Text.styles';

export type TextProps = RNTextProps & UnistylesVariants<typeof styles>;

export const Text = (props: TextProps) => {
    const { children, variant, textAlign, color, ...rest } = props;

    styles.useVariants({ variant, textAlign, color });

    return (
        <RNText {...rest} style={[styles.text, rest.style]}>
            {children}
        </RNText>
    );
};
