import { StyleProp, ViewStyle, View } from 'react-native';
import { UnistylesVariants } from 'react-native-unistyles';

import { ChevronRight16, Icon, IconProps } from '@mobile/shared/ui/Icon';
import { Text } from '@mobile/shared/ui/Text';
import { TouchableOpacity } from '@mobile/shared/ui/TouchableOpacity';

import { styles } from './Banner.styles';

export type BannerProps = UnistylesVariants<typeof styles> & {
    text: string;
    onPress?: () => void;
    icon?: IconProps['icon'];
    actionText?: string;
    style?: StyleProp<ViewStyle>;
};

export const Banner = (props: BannerProps) => {
    const { variant, text, onPress, actionText, icon, style, ...rest } = props;

    styles.useVariants({ variant, ...rest });

    return (
        <TouchableOpacity style={[styles.container, style]} onPress={onPress}>
            <View style={styles.content}>
                <Text variant="bodyM" style={[styles.text, styles.flex]}>
                    {text}
                </Text>
                {icon && <Icon icon={icon} style={styles.icon} />}
            </View>
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
