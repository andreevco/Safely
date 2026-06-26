import { LinearGradient } from 'expo-linear-gradient';
import { Trans, useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Image, Text } from '@mobile/shared/ui';
import { smoothstepGradient } from '@mobile/shared/utils';

import type { SyncOnboardingStepConfig } from './steps';
import { styles } from './SyncOnboarding.styles';

interface Props {
    step: SyncOnboardingStepConfig;
    onLinkPress: () => void;
}

const CARD_BORDER_COLORS = smoothstepGradient('#ffffff', 16, 0.16);
const CARD_BORDER_START = { x: 0, y: 1 };
const CARD_BORDER_END = { x: 0, y: 0 };

export const SyncOnboardingStep = ({ step, onLinkPress }: Props) => {
    const { t } = useTranslation();

    return (
        <View style={styles.page}>
            <Image source={step.illustration} style={styles.illustration} contentFit="contain" />
            <View style={styles.card}>
                <LinearGradient
                    colors={CARD_BORDER_COLORS}
                    start={CARD_BORDER_START}
                    end={CARD_BORDER_END}
                    style={styles.cardBorder}
                    pointerEvents="none"
                />
                <View style={styles.cardContent}>
                    <Text variant="titleL">{t(step.titleKey)}</Text>
                    <Text variant="bodyL" color="secondary">
                        <Trans
                            i18nKey={step.subtitleKey}
                            components={{
                                link: <Text variant="bodyL" color="link" onPress={onLinkPress} />
                            }}
                        />
                    </Text>
                </View>
            </View>
        </View>
    );
};
