import { Text } from '@mobile/shared/ui/Text';
import { View } from 'react-native';

import { styles } from './Title.styles';

interface TitleProps {
    children: React.ReactNode;
}

export const Title = (props: TitleProps) => {
    const { children } = props;

    return (
        <View style={styles.container}>
            <Text textTransform="uppercase" color="tertiary" variant="bodyM">
                {children}
            </Text>
        </View>
    );
};
