import { View } from 'react-native';

import { PortfolioMeta } from '@safely/core';

import { Text, TextProps } from '@mobile/shared/ui';

import { styles } from './PortfolioName.styles';

type PortfolioNameProps = {
    meta: PortfolioMeta;
    size?: number;
    gap?: number;
    fontVariant?: TextProps['variant'];
    color?: TextProps['color'];
    tag?: number | false;
};

export const PortfolioName = (props: PortfolioNameProps) => {
    const { meta, size = 12, gap = 6, fontVariant = 'labelL', color, tag } = props;

    switch (meta.icon.type) {
        case 'color':
            return (
                <View style={styles.contentWithTag}>
                    <View style={styles.container(gap)}>
                        <View style={styles.dot(meta.icon.value, size)} />
                        <Text
                            variant={fontVariant}
                            color={color}
                            numberOfLines={1}
                            style={styles.name}
                        >
                            {meta.name}
                        </Text>
                    </View>
                    {tag && (
                        <View style={styles.tag}>
                            <Text variant="bodyS" color="secondary">
                                #{tag}
                            </Text>
                        </View>
                    )}
                </View>
            );
        case 'emoji':
            return (
                <View style={styles.contentWithTag}>
                    <View style={styles.container(gap)}>
                        <View style={styles.emojiContainer(size)}>
                            <Text style={styles.emoji(size)}>{meta.icon.value}</Text>
                        </View>
                        <Text
                            variant={fontVariant}
                            color={color}
                            numberOfLines={1}
                            style={styles.name}
                        >
                            {meta.name}
                        </Text>
                    </View>
                    {tag && (
                        <View style={styles.tag}>
                            <Text variant="bodyS" color="secondary">
                                #{tag}
                            </Text>
                        </View>
                    )}
                </View>
            );
        default:
            return null;
    }
};
