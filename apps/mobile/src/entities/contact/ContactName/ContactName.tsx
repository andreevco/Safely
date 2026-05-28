import { View } from 'react-native';

import type { ContactMeta } from '@safely/core';

import type { TextProps } from '@mobile/shared/ui';
import { Text } from '@mobile/shared/ui';
import { Icon, Human16 } from '@mobile/shared/ui';

import { styles } from './ContactName.styles';

type ContactNameProps = {
    meta: ContactMeta;
    size?: number;
    gap?: number;
    fontVariant?: TextProps['variant'];
    color?: TextProps['color'];
};

export const ContactName = (props: ContactNameProps) => {
    const { meta, size = 16, gap = 6, fontVariant = 'labelL', color } = props;

    return (
        <View style={styles.container(gap)}>
            <Icon icon={Human16} style={{ tintColor: meta.color, width: size, height: size }} />
            <Text variant={fontVariant} color={color} numberOfLines={1} style={styles.name}>
                {meta.name}
            </Text>
        </View>
    );
};
