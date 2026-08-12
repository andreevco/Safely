import type { ImageProps as ImageComponentProps } from 'expo-image';
import type { ViewStyle } from 'react-native';
import { View } from 'react-native';
import { useUnistyles } from 'react-native-unistyles';

import { Icon, type IconProps } from '@mobile/shared/ui/Icon';
import { Image as ImageComponent } from '@mobile/shared/ui/Image';
import { Skeleton } from '@mobile/shared/ui/Skeleton';

import { styles } from './Image.styles';
import { useCellContext } from '../../CellContext';

export type CellImageType = 'icon' | 'image';

export type ImageCommon = {
    variant?: 'square' | 'rounded';
    containerStyle?: ViewStyle;
    skeleton?: boolean;
};

export type IconType = {
    type: 'icon';
    icon: IconProps['icon'];
    style?: IconProps['style'];
};

export type ImageType = {
    type: 'image';
    image: ImageComponentProps['source'];
    style?: ImageComponentProps['style'];
};

export type ImageProps = ImageCommon & (IconType | ImageType);

export const Image = (props: ImageProps) => {
    const { containerStyle, variant = 'rounded' } = props;
    const cellContext = useCellContext();
    const { theme } = useUnistyles();

    styles.useVariants({ variant });

    if (cellContext.skeleton) {
        return (
            <View style={[containerStyle]}>
                <Skeleton width={32} height={32} borderRadius={theme.radius.full} />
            </View>
        );
    }

    switch (props.type) {
        case 'icon':
            return (
                <View style={[containerStyle]}>
                    <Icon style={[styles.content, props.style]} icon={props.icon} />
                </View>
            );
        case 'image':
            return (
                <View style={[containerStyle]}>
                    <ImageComponent style={[styles.content, props.style]} source={props.image} />
                </View>
            );
        default:
            throw new Error(`Invalid cell image type`);
    }
};
