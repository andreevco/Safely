import { View } from 'react-native';

import { Text, TextProps } from '@mobile/shared/ui/Text';

import { styles } from './Label.styles';

export const InputLabel = (props: TextProps) => {
    const { children, ...rest } = props;

    return (
        <View style={styles.container}>
            <Text variant="bodyM" color="tertiary" {...rest}>
                {children}
            </Text>
        </View>
    );
};
