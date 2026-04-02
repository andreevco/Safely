import { StyleProp, View, ViewStyle } from 'react-native';
import { UnistylesVariants } from 'react-native-unistyles';

import { Text } from '../Text';
import { styles } from './Badge.styles';

type BadgeProps = UnistylesVariants<typeof styles> & {
    children: string;
    isUppercase?: boolean;
    style?: StyleProp<ViewStyle>;
};

export const Badge = (props: BadgeProps) => {
    const { children, type = 'neutral', isUppercase, style } = props;

    styles.useVariants({ type });

    return (
        <View style={[styles.container, style]}>
            <Text
                variant="bodyS"
                style={styles.text}
                textTransform={isUppercase ? 'uppercase' : undefined}
            >
                {children}
            </Text>
        </View>
    );
};
