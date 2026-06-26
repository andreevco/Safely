import type { ViewStyle } from 'react-native';
import Animated, { type AnimatedStyle } from 'react-native-reanimated';

import { Image } from '@mobile/shared/ui';

import type { SyncOnboardingStepConfig } from './steps';
import { styles } from './SyncOnboarding.styles';

interface Props {
    step: SyncOnboardingStepConfig;
    style: AnimatedStyle<ViewStyle>;
}

export const StepIllustration = ({ step, style }: Props) => (
    <Animated.View style={[styles.illustrationLayer, style]} pointerEvents="none">
        <Image source={step.illustration} style={styles.illustrationImage} contentFit="contain" />
    </Animated.View>
);
