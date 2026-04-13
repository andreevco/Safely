import { View } from 'react-native';

import { Icon, IconProps } from '@mobile/shared/ui/Icon';
import { Text } from '@mobile/shared/ui/Text';
import { TouchableOpacity } from '@mobile/shared/ui/TouchableOpacity';

import { styles } from './ActionsButton.styles';

export type ActionsButtonProps = {
    title: string;
    icon: IconProps['icon'];
    onPress: () => void;
    opacity?: number;
};

export const ActionsButton = (props: ActionsButtonProps) => {
    const { title, icon, onPress, opacity } = props;

    return (
        <TouchableOpacity
            onPress={onPress}
            style={[styles.container, opacity != null && { opacity }]}
        >
            <View style={styles.iconContainer}>
                <Icon icon={icon} size={28} />
            </View>
            <Text variant="bodyM">{title}</Text>
        </TouchableOpacity>
    );
};
