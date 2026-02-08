import { Icon, IconProps } from '@mobile/shared/ui/Icon';
import { Image as ImageComponent, ImageProps as ImageComponentProps } from 'expo-image';
import { View, ViewStyle } from 'react-native';

import { styles } from './Image.styles';

export type CellImageType = 'icon' | 'image';

export type ImageCommon = {
    containerStyle?: ViewStyle;
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
    const { containerStyle } = props;

    switch (props.type) {
        case 'icon':
            return (
                <View style={[styles.container, containerStyle]}>
                    <Icon style={[styles.content, props.style]} icon={props.icon} />
                </View>
            );
        case 'image':
            return (
                <View style={[styles.container, containerStyle]}>
                    <ImageComponent style={[styles.content, props.style]} source={props.image} />
                </View>
            );
        default:
            throw new Error(`Invalid cell image type`);
    }
};
