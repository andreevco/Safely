import { Trans } from 'react-i18next';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { LinkingProtocol, useLinking } from '@safely/ux';

import { Icon, Text, TouchableOpacity, ChevronRight8 } from '@mobile/shared/ui';

import { styles } from './ProviderLabel.styles';

type ProviderLabelProps = {
    label: string;
    link?: string;
};

export const ProviderLabel = (props: ProviderLabelProps) => {
    const { label, link } = props;
    const { openURL } = useLinking();

    return (
        <Animated.View entering={FadeIn.duration(100)} exiting={FadeOut.duration(100)}>
            <TouchableOpacity
                disabled={!link}
                onPress={() => openURL(link!, { allowedProtocols: [LinkingProtocol.HTTPS] })}
                style={styles.container}
            >
                <Text variant="bodyS" color="tertiary">
                    <Trans
                        defaults={label}
                        components={{ a: <Text variant="bodyS" color="secondary" /> }}
                    />
                </Text>
                {link && <Icon style={styles.chevron} icon={ChevronRight8} color="tertiary" />}
            </TouchableOpacity>
        </Animated.View>
    );
};
