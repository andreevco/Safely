import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { useToast } from '@safely/ux';

import { Button, Icon } from '@mobile/shared/ui';
import { ArrowLeft16, Xmark16 } from '@mobile/shared/ui/Icon';
import { smoothstepGradient } from '@mobile/shared/utils';

import { StepContent } from './StepContent';
import { StepIllustration } from './StepIllustration';
import { SYNC_ONBOARDING_STEPS } from './steps';
import { styles } from './SyncOnboarding.styles';
import { useStepTransition } from './useStepTransition';
import { useSyncOnboardingFlow } from './useSyncOnboardingFlow';

interface Props {
    onClose: () => void;
    onFinish: () => void;
}

const CARD_BORDER_COLORS = smoothstepGradient('#ffffff', 16, 0.16);
const CARD_BORDER_START = { x: 0, y: 1 };
const CARD_BORDER_END = { x: 0, y: 0 };

export const SyncOnboarding = ({ onClose, onFinish }: Props) => {
    const { t } = useTranslation();
    const { index, isFirst, goNext, goBack } = useSyncOnboardingFlow({
        stepCount: SYNC_ONBOARDING_STEPS.length,
        onFinish
    });
    const { layerKey, entering, exiting } = useStepTransition(index);
    const toast = useToast();

    const currentStep = SYNC_ONBOARDING_STEPS[index];

    const handleLinkPress = () => {
        toast('TODO: Link');
    };

    const handleNext = () => {
        void goNext();
    };

    const handleBack = () => {
        goBack();
    };

    return (
        <Animated.View
            entering={FadeIn.duration(150)}
            exiting={FadeOut.duration(150)}
            style={styles.overlay}
        >
            <View style={styles.header}>
                <Pressable style={styles.closeButton} onPress={onClose} hitSlop={12}>
                    <Icon icon={Xmark16} color="primary" />
                </Pressable>
            </View>

            <View style={styles.illustrationZone}>
                <StepIllustration
                    key={layerKey}
                    step={currentStep}
                    entering={entering}
                    exiting={exiting}
                />
            </View>

            <View style={styles.card}>
                <LinearGradient
                    colors={CARD_BORDER_COLORS}
                    start={CARD_BORDER_START}
                    end={CARD_BORDER_END}
                    style={styles.cardBorder}
                    pointerEvents="none"
                />
                <View style={styles.cardContent}>
                    <StepContent
                        key={layerKey}
                        step={currentStep}
                        entering={entering}
                        exiting={exiting}
                        onLinkPress={handleLinkPress}
                    />
                </View>
            </View>

            <View style={styles.footer}>
                {!isFirst ? (
                    <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(150)}>
                        <Pressable style={styles.backButton} onPress={handleBack} hitSlop={12}>
                            <Icon icon={ArrowLeft16} color="primary" />
                        </Pressable>
                    </Animated.View>
                ) : (
                    <View />
                )}
                <Button type="primary" size="medium" onPress={handleNext}>
                    {t('common.next')}
                </Button>
            </View>
        </Animated.View>
    );
};
