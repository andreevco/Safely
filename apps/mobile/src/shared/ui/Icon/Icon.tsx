import { Image, ImageProps, ImageSource } from 'expo-image';
import { UnistylesVariants } from 'react-native-unistyles';

import { styles } from './Icon.styles';

export type IconProps = UnistylesVariants<typeof styles> &
    ImageProps & {
        icon: {
            image: ImageSource;
            size: number;
        };
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
