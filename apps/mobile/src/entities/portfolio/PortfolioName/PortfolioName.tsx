import { View } from 'react-native';

import { PortfolioMeta } from '@safely/core';

import { Text, TextProps } from '@mobile/shared/ui';

import { styles } from './PortfolioName.styles';

type PortfolioNameProps = {
    meta: PortfolioMeta;
    size?: number;
    gap?: number;
    fontVariant?: TextProps['variant'];
    tag?: number | false;
};

export const PortfolioName = (props: PortfolioNameProps) => {
    const { meta, size = 12, gap = 6, fontVariant = 'labelL', tag } = props;

    switch (meta.icon.type) {
        case 'color':
            return (
                <View style={styles.contentWithTag}>
                    <View style={styles.container(gap)}>
                        <View style={styles.dot(meta.icon.value, size)} />
                        <Text variant={fontVariant}>{meta.name}</Text>
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
                        <Text>{meta.icon.value}</Text>
                        <Text variant={fontVariant}>{meta.name}</Text>
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
