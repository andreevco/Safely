import { useCallback } from 'react';
import type { RefObject } from 'react';
import { View } from 'react-native';
import type { GestureType } from 'react-native-gesture-handler';

import type { ILedgerDerivation, Portfolio } from '@safely/core';
import { useReorderDerivations, useSetActivePortfolio } from '@safely/ux';

import { useReorderEngine } from '@mobile/shared/ui';

import { DraggableDerivation } from './DraggableDerivation';
import { ROW_HEIGHT } from '../../constants';

type DerivationReorderListProps = {
    portfolio: Portfolio;
    derivations: ILedgerDerivation[];
    isActivePortfolio: boolean;
    activeDerivationIndex: number | undefined;
    blockExternalRefs: RefObject<GestureType | undefined>[];
    onSelectDerivation: (derivationIndex: number) => void;
};

export const DerivationReorderList = (props: DerivationReorderListProps) => {
    const {
        portfolio,
        derivations,
        isActivePortfolio,
        activeDerivationIndex,
        blockExternalRefs,
        onSelectDerivation
    } = props;

    const { mutate: reorderDerivations } = useReorderDerivations();
    const { mutate: setActivePortfolio } = useSetActivePortfolio();

    const ids = derivations.map(d => d.id.toString());
    const engine = useReorderEngine(
        ids,
        useCallback(
            () => Object.fromEntries(derivations.map(d => [d.id.toString(), ROW_HEIGHT])),
            [derivations]
        )
    );

    const handleReorder = useCallback(
        (orderedDerivationIds: string[]) => {
            if (isActivePortfolio && activeDerivationIndex !== undefined) {
                setActivePortfolio({ id: portfolio.id, derivationIndex: activeDerivationIndex });
            }

            reorderDerivations({ portfolio, orderedDerivationIds });
        },
        [
            portfolio,
            reorderDerivations,
            setActivePortfolio,
            isActivePortfolio,
            activeDerivationIndex
        ]
    );

    return (
        <View style={{ height: derivations.length * ROW_HEIGHT }}>
            {derivations.map((derivation, index) => (
                <DraggableDerivation
                    key={derivation.id.toString()}
                    derivation={derivation}
                    itemsCount={derivations.length}
                    engine={engine}
                    isSelected={isActivePortfolio && activeDerivationIndex === derivation.index}
                    showDivider={index !== derivations.length - 1}
                    blockExternalRefs={blockExternalRefs}
                    onReorder={handleReorder}
                    onPress={() => onSelectDerivation(derivation.index)}
                />
            ))}
        </View>
    );
};
