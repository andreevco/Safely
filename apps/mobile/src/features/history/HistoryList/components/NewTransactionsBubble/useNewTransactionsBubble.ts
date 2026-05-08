import { type RefObject, useCallback } from 'react';
import {
    type SharedValue,
    useAnimatedScrollHandler,
    useDerivedValue,
    useSharedValue
} from 'react-native-reanimated';

import { type ListRef } from '@mobile/shared/ui/Screen/components/List';

const TOP_THRESHOLD = 24;

export type UseNewTransactionsBubbleArgs = {
    listRef: RefObject<Pick<ListRef<unknown>, 'scrollToOffset'> | null>;
};

export type UseNewTransactionsBubbleReturn = {
    scrollHandler: ReturnType<typeof useAnimatedScrollHandler>;
    bubbleProps: { visibleSV: SharedValue<boolean>; onPress: () => void };
    markUnread: () => void;
};

export function useNewTransactionsBubble(
    args: UseNewTransactionsBubbleArgs
): UseNewTransactionsBubbleReturn {
    const { listRef } = args;

    const hasUnreadSV = useSharedValue(false);
    const atTopSV = useSharedValue(true);

    const visibleSV = useDerivedValue(() => hasUnreadSV.value && !atTopSV.value);

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: event => {
            'worklet';
            const nextAtTop = event.contentOffset.y <= TOP_THRESHOLD;
            atTopSV.value = nextAtTop;
            if (nextAtTop) {
                hasUnreadSV.value = false;
            }
        }
    });

    const markUnread = useCallback(() => {
        if (!atTopSV.value) {
            hasUnreadSV.value = true;
        }
    }, [atTopSV, hasUnreadSV]);

    const onPress = useCallback(() => {
        hasUnreadSV.value = false;
        listRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, [hasUnreadSV, listRef]);

    return {
        scrollHandler,
        bubbleProps: { visibleSV, onPress },
        markUnread
    };
}
