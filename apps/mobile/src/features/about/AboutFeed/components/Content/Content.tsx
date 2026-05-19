import { ReactElement } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useBootConfig, useLinking } from '@safely/ux';

import { Text } from '@mobile/shared/ui';

import { styles } from './Content.styles';
import { AboutBlock, LinkTarget } from '../../cards';

interface ContentProps {
    blocks: AboutBlock[];
}

export const Content = ({ blocks }: ContentProps) => {
    const { t } = useTranslation();
    const { openURL } = useLinking();
    const telegramUrl = useBootConfig().references.support.telegram;

    const resolveUrl = (target: LinkTarget): string => {
        // TODO: maybe instead of kind we should hardcore URL directly
        switch (target.kind) {
            case 'telegram':
                return telegramUrl;
            case 'whatsapp':
                return 'TODO: whatsapp URL';
            case 'article':
                return 'TODO: article URL';
        }
    };

    const buildLinkComponents = (
        links?: Record<string, LinkTarget>
    ): Record<string, ReactElement> => {
        const components: Record<string, ReactElement> = {};

        if (links) {
            for (const [tag, target] of Object.entries(links)) {
                components[tag] = (
                    <Text
                        variant="bodyM"
                        color="link"
                        onPress={() => openURL(resolveUrl(target))}
                    />
                );
            }
        }

        return components;
    };

    const renderBlock = (block: AboutBlock, index: number) => {
        switch (block.type) {
            case 'heading':
                return (
                    <Text key={index} variant="labelM">
                        {t(block.i18nKey)}
                    </Text>
                );
            case 'list':
                return (
                    <View key={index} style={styles.list}>
                        {block.items.map((itemKey, itemIndex) => (
                            <View key={itemIndex} style={styles.listRow}>
                                <Text variant="bodyM" color="secondary">
                                    {'•'}
                                </Text>
                                <Text variant="bodyM" style={styles.listText}>
                                    {t(itemKey)}
                                </Text>
                            </View>
                        ))}
                    </View>
                );
            case 'paragraph':
                return (
                    <Text key={index} variant="bodyM">
                        <Trans
                            i18nKey={block.i18nKey}
                            components={buildLinkComponents(block.links)}
                        />
                    </Text>
                );
        }
    };

    return <>{blocks.map(renderBlock)}</>;
};
