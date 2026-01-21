import { Icon, IconProps } from '@mobile/shared/ui/Icon';
import { Image, ImageSource, ImageProps } from 'expo-image';
import { View, ViewStyle } from 'react-native';

import { styles } from './CellImage.styles';

export type CellImageType = 'icon' | 'image';

export type CellImageCommon = {
    containerStyle?: ViewStyle;
};

export type CellImageIcon = {
    type: 'icon';
    icon: IconProps['icon'];
    style?: IconProps['style'];
};

export type CellImageImage = {
    type: 'image';
    image: ImageSource;
    style?: ImageProps['style'];
};

export type CellImageProps = CellImageCommon & (CellImageIcon | CellImageImage);

export const CellImage = (props: CellImageProps) => {
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
                    <Image style={[styles.content, props.style]} source={props.image} />
                </View>
            );
        default:
            throw new Error(`Invalid cell image type`);
    }
};
