import { Trans, useTranslation } from 'react-i18next';
import type { ViewStyle } from 'react-native';
import Animated, { type AnimatedStyle } from 'react-native-reanimated';

import { Text } from '@mobile/shared/ui';

import type { SyncOnboardingStepConfig } from './steps';
import { styles } from './SyncOnboarding.styles';

interface Props {
    step: SyncOnboardingStepConfig;
    style: AnimatedStyle<ViewStyle>;
    onLinkPress: () => void;
}

export const StepContent = ({ step, style, onLinkPress }: Props) => {
    const { t } = useTranslation();

    return (
        <Animated.View style={[styles.contentLayer, style]}>
            <Text variant="titleL">{t(step.titleKey)}</Text>
            <Text variant="bodyL" color="secondary">
                <Trans
                    i18nKey={step.subtitleKey}
                    components={{
                        a: <Text variant="bodyL" color="link" onPress={onLinkPress} />
                    }}
                />
            </Text>
        </Animated.View>
    );
};
