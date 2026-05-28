import type { ImageStyle } from 'expo-image';
import { Image } from 'expo-image';
import type { ImageSourcePropType, StyleProp } from 'react-native';
import type { UnistylesVariants } from 'react-native-unistyles';

import { styles } from './Icon.styles';

export type IconProps = UnistylesVariants<typeof styles> & {
    icon: {
        image: ImageSourcePropType;
        size: number;
    };
    style?: StyleProp<ImageStyle>;
    size?: number;
    color?: string;
};

export const Icon = (props: IconProps) => {
    const { icon, size, color, style } = props;

    const iconSize = size ?? icon.size;
    styles.useVariants({
        color: color
    });

    return <Image source={icon.image} style={[styles.icon(iconSize), style]} />;
};
