import { View } from 'react-native';

import type { ExternalLinkPost } from '@safely/core';
import { LinkingProtocol, useLinking } from '@safely/ux';

import { Image, Text, TouchableOpacity } from '@mobile/shared/ui';

import { styles } from './ExternalLinkCard.styles';

export const ExternalLinkCard = ({ title, description, url, img_url }: ExternalLinkPost) => {
    const { openURL } = useLinking();

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={() => openURL(url, { allowedProtocols: [LinkingProtocol.HTTPS] })}
        >
            <View style={styles.body}>
                <Text variant="labelM">{title}</Text>
                <Text variant="bodyM" numberOfLines={2}>
                    {description}
                </Text>
            </View>
            {img_url ? (
                <Image source={{ uri: img_url }} style={styles.image} contentFit="cover" />
            ) : null}
        </TouchableOpacity>
    );
};
