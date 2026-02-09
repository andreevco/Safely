import { View } from 'react-native';
import { UnistylesVariants } from 'react-native-unistyles';

import { ChevronRight16, Icon } from '@mobile/shared/ui/Icon';
import { Text } from '@mobile/shared/ui/Text';
import { TouchableOpacity } from '@mobile/shared/ui/TouchableOpacity';

import { styles } from './Banner.styles';

export type BannerProps = UnistylesVariants<typeof styles> & {
    text: string;
    onPress?: () => void;
    actionText?: string;
};

export const Banner = (props: BannerProps) => {
    const { variant, text, onPress, actionText, ...rest } = props;

    styles.useVariants({ variant, ...rest });

    return (
        <TouchableOpacity style={styles.container} onPress={onPress}>
            <Text variant="bodyM" style={styles.text}>
                {text}
            </Text>
            {actionText && (
                <View style={styles.action}>
                    <Text variant="labelM" style={styles.text}>
                        {actionText}
                    </Text>
                    <Icon icon={ChevronRight16} style={styles.icon} />
                </View>
            )}
        </TouchableOpacity>
    );
};
