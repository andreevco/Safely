import { Text } from '@mobile/shared/ui/Text';
import { View } from 'react-native';

import { styles } from './Title.styles';
import { useHeaderHasSides, useHeaderVariant } from '../../Header.context';

interface TitleProps {
    children?: React.ReactNode;
}

export const Title = (props: TitleProps) => {
    const { children } = props;
    const variant = useHeaderVariant();
    const hasSides = useHeaderHasSides();

    styles.useVariants({ variant });

    return (
        <View style={styles.container(hasSides)}>
            <Text textAlign={variant} variant="titleS" numberOfLines={1}>
                {children}
            </Text>
        </View>
    );
};
