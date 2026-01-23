import { Text } from '@mobile/shared/ui/Text';
import { View } from 'react-native';

interface TitleProps {
    children: React.ReactNode;
}

export const Title = (props: TitleProps) => {
    const { children } = props;

    return (
        <View>
            <Text capitalize color="tertiary" variant="bodyM">
                {children}
            </Text>
        </View>
    );
};
