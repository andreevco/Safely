import { Trans, useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Image, Text } from '@mobile/shared/ui';

import type { SyncOnboardingStepConfig } from './steps';
import { styles } from './SyncOnboarding.styles';

interface Props {
    step: SyncOnboardingStepConfig;
    onLinkPress: () => void;
}

export const SyncOnboardingStep = ({ step, onLinkPress }: Props) => {
    const { t } = useTranslation();

    return (
        <View style={styles.page}>
            <Image source={step.illustration} style={styles.illustration} contentFit="contain" />
            <View style={styles.card}>
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
    );
};
