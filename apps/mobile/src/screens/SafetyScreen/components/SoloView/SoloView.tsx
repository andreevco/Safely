import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { DeviceLinkExclamationmark96, Icon, Screen, Text } from '@mobile/shared/ui';

import { styles } from './SoloView.styles';

const steps = [
    'safety.protectAccount.steps.step1',
    'safety.protectAccount.steps.step2',
    'safety.protectAccount.steps.step3'
] as const;

export const SoloView = () => {
    const { t } = useTranslation();

    return (
        <Screen.Content>
            <View style={styles.content}>
                <Icon icon={DeviceLinkExclamationmark96} />
                <View style={styles.textContainer}>
                    <Text textAlign="center" variant="titleM">
                        {t('safety.protectAccount.title')}
                    </Text>
                    <Text textAlign="center" variant="bodyL" color="secondary">
                        {t('safety.protectAccount.subtitle')}
                    </Text>
                </View>
                <View style={styles.stepsContainer}>
                    {steps.map((step, index) => (
                        <View key={step} style={styles.stepRow}>
                            <View style={styles.stepNumber}>
                                <Text variant="bodyM" color="tertiary" monospace>
                                    {index + 1}.
                                </Text>
                            </View>
                            <View style={styles.stepText}>
                                <Text variant="bodyM">{t(step)}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            </View>
        </Screen.Content>
    );
};
