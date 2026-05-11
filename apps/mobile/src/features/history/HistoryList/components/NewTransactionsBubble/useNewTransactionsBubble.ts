import { type RefObject, useCallback } from 'react';
import { type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { type SharedValue, useSharedValue } from 'react-native-reanimated';

import { type ListRef } from '@mobile/shared/ui/Screen/components/List';

export enum NewTransactionsBubbleMode {
    HIDDEN = 0,
    ONE = 1,
    MANY = 2
}

type UseNewTransactionsBubbleOptions = {
    listRef: RefObject<Pick<ListRef<unknown>, 'scrollToOffset'> | null>;
    topThreshold: number;
};

type UseNewTransactionsBubbleReturn = {
    scrollHandler: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
    mode: SharedValue<NewTransactionsBubbleMode>;
    onPress: () => void;
    show: () => void;
};

export function useNewTransactionsBubble(
    options: UseNewTransactionsBubbleOptions
): UseNewTransactionsBubbleReturn {
    const { listRef, topThreshold } = options;

    const mode = useSharedValue<NewTransactionsBubbleMode>(NewTransactionsBubbleMode.HIDDEN);
    const atTop = useSharedValue(true);

    const scrollHandler = useCallback(
        (event: NativeSyntheticEvent<NativeScrollEvent>) => {
            const nextAtTop = event.nativeEvent.contentOffset.y <= topThreshold;
            if (atTop.value !== nextAtTop) {
                atTop.value = nextAtTop;
            }
            if (nextAtTop && mode.value !== NewTransactionsBubbleMode.HIDDEN) {
                mode.value = NewTransactionsBubbleMode.HIDDEN;
            }
        },
        [atTop, mode, topThreshold]
    );

    const show = useCallback(() => {
        if (atTop.value) {
            return;
        }

        switch (mode.value) {
            case NewTransactionsBubbleMode.HIDDEN:
                mode.value = NewTransactionsBubbleMode.ONE;
                break;
            case NewTransactionsBubbleMode.ONE:
                mode.value = NewTransactionsBubbleMode.MANY;
                break;
        }
    }, [atTop, mode]);

    const onPress = useCallback(() => {
        mode.value = NewTransactionsBubbleMode.HIDDEN;
        listRef.current?.scrollToOffset({ offset: 0, animated: true, viewPosition: 0 });
    }, [mode, listRef]);

    return {
        scrollHandler,
        mode,
        onPress,
        show
    };
}
