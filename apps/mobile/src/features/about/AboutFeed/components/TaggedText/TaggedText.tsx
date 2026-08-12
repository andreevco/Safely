import type { ReactElement, ReactNode } from 'react';
import { Trans } from 'react-i18next';

import { LinkingProtocol, useLinking } from '@safely/ux';

import { Text } from '@mobile/shared/ui';

import { styles } from './TaggedText.styles';

interface TaggedTextProps {
    taggedText: string;
    links?: Record<string, string>;
}

const Bullet = ({ children }: { children?: ReactNode }) => (
    <Text>
        {'\n• '}
        {children}
    </Text>
);
const LineBreak = () => <Text>{'\n'}</Text>;

export const TaggedText = ({ taggedText, links }: TaggedTextProps) => {
    const { openURL } = useLinking();

    const components: Record<string, ReactElement> = {
        b: <Text style={styles.bold} />,
        br: <LineBreak />,
        li: <Bullet />
    };
    for (const [name, url] of Object.entries(links ?? {})) {
        components[name] = (
            <Text
                color="link"
                onPress={() => openURL(url, { allowedProtocols: [LinkingProtocol.HTTPS] })}
            />
        );
    }

    return (
        <Text variant="bodyM">
            <Trans defaults={taggedText} components={components} />
        </Text>
    );
};
