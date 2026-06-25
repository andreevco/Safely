import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import PagerView, { type PagerViewOnPageSelectedEvent } from 'react-native-pager-view';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { useSyncOnboardingFlow, useToast } from '@safely/ux';

import { Button, Icon } from '@mobile/shared/ui';
import { ArrowLeft16, Xmark16 } from '@mobile/shared/ui/Icon';

import { SYNC_ONBOARDING_STEPS } from './steps';
import { styles } from './SyncOnboarding.styles';
import { SyncOnboardingStep } from './SyncOnboardingStep';

interface Props {
    onClose: () => void;
    onFinish: () => void;
}

export const SyncOnboarding = ({ onClose, onFinish }: Props) => {
    const { t } = useTranslation();
    const pagerRef = useRef<PagerView>(null);
    const { index, isFirst, goNext, goBack, moveToIndex } = useSyncOnboardingFlow({
        stepCount: SYNC_ONBOARDING_STEPS.length,
        onFinish
    });
    const toast = useToast();
    useEffect(() => {
        pagerRef.current?.setPage(index);
    }, [index]);

    const handlePageSelected = (e: PagerViewOnPageSelectedEvent) => {
        moveToIndex(e.nativeEvent.position);
    };

    const handleLinkPress = () => {
        toast('TODO: Link');
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

            <PagerView ref={pagerRef} style={styles.pager} onPageSelected={handlePageSelected}>
                {SYNC_ONBOARDING_STEPS.map(step => (
                    <SyncOnboardingStep key={step.id} step={step} onLinkPress={handleLinkPress} />
                ))}
            </PagerView>

            <View style={styles.footer}>
                {!isFirst ? (
                    <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(150)}>
                        <Pressable style={styles.backButton} onPress={goBack} hitSlop={12}>
                            <Icon icon={ArrowLeft16} color="primary" />
                        </Pressable>
                    </Animated.View>
                ) : (
                    <View />
                )}
                <Button type="primary" size="medium" onPress={() => void goNext()}>
                    {t('common.next')}
                </Button>
            </View>
        </Animated.View>
    );
};
