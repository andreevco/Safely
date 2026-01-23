import { Text } from '@mobile/shared/ui/Text';
import { View } from 'react-native';

import { styles } from './Title.styles';
import { useHeaderVariant } from '../../Header.context';

interface TitleProps {
    children: React.ReactNode;
}

export const Title = (props: TitleProps) => {
    const { children } = props;
    const variant = useHeaderVariant();

    return (
        <View style={styles.container(variant === 'left')}>
            <Text textAlign={variant} variant="titleS" numberOfLines={1}>
                {children}
            </Text>
        </View>
    );
};
