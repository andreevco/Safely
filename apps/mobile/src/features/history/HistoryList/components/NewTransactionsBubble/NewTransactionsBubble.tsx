import Animated, {
    Easing,
    type SharedValue,
    useAnimatedProps,
    useAnimatedStyle,
    withTiming
} from 'react-native-reanimated';

import { useTranslate } from '@safely/ux';

import { Toast } from '@mobile/shared/ui';

import {
    HIDE_DURATION,
    HIDE_TRANSLATE_DURATION,
    ANIMATION_START_Y,
    SHOW_DURATION,
    SHOW_TRANSLATE_DURATION,
    styles
} from './NewTransactionsBubble.styles';

export type NewTransactionsBubbleProps = {
    visible: SharedValue<boolean>;
    onPress: () => void;
};

export const NewTransactionsBubble = (props: NewTransactionsBubbleProps) => {
    const { visible, onPress } = props;
    const t = useTranslate();

    const animatedStyle = useAnimatedStyle(() => {
        if (visible.value) {
            return {
                opacity: withTiming(1, {
                    duration: SHOW_DURATION,
                    easing: Easing.out(Easing.cubic)
                }),
                transform: [
                    {
                        translateY: withTiming(0, {
                            duration: SHOW_TRANSLATE_DURATION,
                            easing: Easing.out(Easing.cubic)
                        })
                    }
                ]
            };
        }
        return {
            opacity: withTiming(0, {
                duration: HIDE_DURATION,
                easing: Easing.in(Easing.cubic)
            }),
            transform: [
                {
                    translateY: withTiming(ANIMATION_START_Y, {
                        duration: HIDE_TRANSLATE_DURATION,
                        easing: Easing.in(Easing.cubic)
                    })
                }
            ]
        };
    });

    const animatedProps = useAnimatedProps(() => ({
        pointerEvents: visible.value ? ('auto' as const) : ('none' as const)
    }));

    return (
        <Animated.View style={[styles.container, animatedStyle]} animatedProps={animatedProps}>
            <Toast message={t('history.bubble.one')} onPress={onPress} />
        </Animated.View>
    );
};
