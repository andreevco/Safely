import { type RefObject, useCallback } from 'react';
import { type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { type SharedValue, useDerivedValue, useSharedValue } from 'react-native-reanimated';

import { type ListRef } from '@mobile/shared/ui/Screen/components/List';

type UseNewTransactionsBubbleOptions = {
    listRef: RefObject<Pick<ListRef<unknown>, 'scrollToOffset'> | null>;
    topThreshold?: number;
};

type UseNewTransactionsBubbleReturn = {
    scrollHandler: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
    visible: SharedValue<boolean>;
    onPress: () => void;
    show: () => void;
};

export function useNewTransactionsBubble(
    options: UseNewTransactionsBubbleOptions
): UseNewTransactionsBubbleReturn {
    const { listRef, topThreshold = 24 } = options;

    const showBubble = useSharedValue(false);
    const atTop = useSharedValue(true);

    const visible = useDerivedValue(() => showBubble.value && !atTop.value);

    const scrollHandler = useCallback(
        (event: NativeSyntheticEvent<NativeScrollEvent>) => {
            const nextAtTop = event.nativeEvent.contentOffset.y <= topThreshold;
            if (atTop.value !== nextAtTop) {
                atTop.value = nextAtTop;
            }
            if (nextAtTop && showBubble.value) {
                showBubble.value = false;
            }
        },
        [atTop, showBubble, topThreshold]
    );

    const show = useCallback(() => {
        if (!atTop.value) {
            showBubble.value = true;
        }
    }, [atTop, showBubble]);

    const onPress = useCallback(() => {
        showBubble.value = false;
        listRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, [showBubble, listRef]);

    return {
        scrollHandler,
        visible,
        onPress,
        show
    };
}
