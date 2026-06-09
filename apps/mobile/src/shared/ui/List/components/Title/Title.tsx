import { View, type ViewStyle } from 'react-native';

import { Text, type TextProps } from '@mobile/shared/ui/Text';

import { styles } from './Title.styles';

type TitleProps = TextProps & {
    containerStyle?: ViewStyle;
};

export const Title = (props: TitleProps) => {
    const { children, containerStyle, ...rest } = props;

    return (
        <View style={[styles.container, containerStyle]}>
            <Text textTransform="uppercase" color="tertiary" variant="bodyM" {...rest}>
                {children}
            </Text>
        </View>
    );
};
