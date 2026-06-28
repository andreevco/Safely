import type { RefObject } from 'react';
import { View } from 'react-native';
import type { GestureType } from 'react-native-gesture-handler';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';

import type { ILedgerDerivation } from '@safely/core';

import type { ReorderEngine } from '@mobile/shared/ui';
import { Draggable } from '@mobile/shared/ui';

import { DerivationRow } from '../DerivationRow';

type DraggableDerivationProps = {
    derivation: ILedgerDerivation;
    itemsCount: number;
    engine: ReorderEngine;
    isSelected: boolean;
    showDivider: boolean;
    blockExternalRefs: RefObject<GestureType | undefined>[];
    onReorder: (orderedIds: string[]) => void;
    onPress: () => void;
};

export const DraggableDerivation = (props: DraggableDerivationProps) => {
    const {
        derivation,
        itemsCount,
        engine,
        isSelected,
        showDivider,
        blockExternalRefs,
        onReorder,
        onPress
    } = props;

    return (
        <Draggable
            id={derivation.id.toString()}
            itemsCount={itemsCount}
            engine={engine}
            onReorder={onReorder}
            activationDelay={150}
            onPress={onPress}
            blockExternalRefs={blockExternalRefs}
        >
            {({ gesture, underlayStyle }) => (
                <GestureDetector gesture={gesture}>
                    <View>
                        <Animated.View style={underlayStyle} />
                        <DerivationRow
                            derivation={derivation}
                            isSelected={isSelected}
                            showDivider={showDivider}
                        />
                    </View>
                </GestureDetector>
            )}
        </Draggable>
    );
};
