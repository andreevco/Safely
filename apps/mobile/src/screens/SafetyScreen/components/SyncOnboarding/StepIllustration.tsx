import { memo, type ComponentProps } from 'react';
import Animated from 'react-native-reanimated';

import { Image } from '@mobile/shared/ui';

import type { SyncOnboardingStepConfig } from './steps';
import { styles } from './SyncOnboarding.styles';

type AnimatedViewProps = ComponentProps<typeof Animated.View>;

interface Props {
    step: SyncOnboardingStepConfig;
    entering?: AnimatedViewProps['entering'];
    exiting?: AnimatedViewProps['exiting'];
}

export const StepIllustration = memo(({ step, entering, exiting }: Props) => (
    <Animated.View
        style={styles.illustrationLayer}
        entering={entering}
        exiting={exiting}
        pointerEvents="none"
    >
        <Image source={step.illustration} style={styles.illustrationImage} contentFit="contain" />
    </Animated.View>
));

StepIllustration.displayName = 'StepIllustration';
