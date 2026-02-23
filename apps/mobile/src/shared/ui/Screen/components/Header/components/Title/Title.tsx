import { View } from 'react-native';

import { Text } from '@mobile/shared/ui/Text';

import { styles } from './Title.styles';
import { useHeaderContext } from '../../Header.context';

interface TitleProps {
    children?: React.ReactNode;
}

export const Title = (props: TitleProps) => {
    const { children } = props;
    const { variant, hasSides, shouldInsetTop } = useHeaderContext();

    styles.useVariants({ variant });

    return (
        <View style={styles.container({ hasSides, shouldInsetTop })}>
            {typeof children === 'string' ? (
                <Text textAlign={variant} variant="titleS" numberOfLines={1}>
                    {children}
                </Text>
            ) : (
                children
            )}
        </View>
    );
};
