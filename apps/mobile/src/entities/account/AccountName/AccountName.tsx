import { Text, TextProps } from '@mobile/shared/ui';
import { View } from 'react-native';

import { styles } from './AccountName.styles';

type AccountNameProps = {
    name: string;
    color: string;
    size?: number;
    gap?: number;
    fontVariant?: TextProps['variant'];
};

export const AccountName = (props: AccountNameProps) => {
    const { name, color, size = 12, gap = 6, fontVariant = 'labelL' } = props;

    return (
        <View style={styles.container(gap)}>
            <View style={styles.dot(color, size)} />
            <Text variant={fontVariant}>{name}</Text>
        </View>
    );
};
