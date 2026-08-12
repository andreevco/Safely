import { memo, type ComponentProps } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import Animated from 'react-native-reanimated';

import { Text } from '@mobile/shared/ui';

import type { SyncOnboardingStepConfig } from './steps';
import { styles } from './SyncOnboarding.styles';

type AnimatedViewProps = ComponentProps<typeof Animated.View>;

interface Props {
    step: SyncOnboardingStepConfig;
    entering?: AnimatedViewProps['entering'];
    exiting?: AnimatedViewProps['exiting'];
    onLinkPress: () => void;
}

export const StepContent = memo(({ step, entering, exiting, onLinkPress }: Props) => {
    const { t } = useTranslation();

    return (
        <Animated.View style={styles.contentLayer} entering={entering} exiting={exiting}>
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
});

StepContent.displayName = 'StepContent';
