import { Trans } from 'react-i18next';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { LinkingProtocol, useLinking } from '@safely/ux';

import { Icon, Text, TouchableOpacity, ChevronRight8 } from '@mobile/shared/ui';

import { styles } from './ProviderLabel.styles';

type ProviderLabelProps = {
    label: string;
    url?: string;
};

export const ProviderLabel = (props: ProviderLabelProps) => {
    const { label, url } = props;
    const { openURL } = useLinking();
    return (
        <Animated.View entering={FadeIn.duration(100)} exiting={FadeOut.duration(100)}>
            <TouchableOpacity
                disabled={!url}
                onPress={() => openURL(url!, [LinkingProtocol.HTTPS])}
                style={styles.container}
            >
                <Text variant="bodyS" color="tertiary">
                    <Trans
                        defaults={label}
                        components={{ link: <Text variant="bodyS" color="secondary" /> }}
                    />
                </Text>
                {url && <Icon icon={ChevronRight8} color="tertiary" />}
            </TouchableOpacity>
        </Animated.View>
    );
};
