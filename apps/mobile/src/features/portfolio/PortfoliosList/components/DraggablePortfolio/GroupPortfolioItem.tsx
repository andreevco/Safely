import { memo, useMemo, useRef } from 'react';
import { View } from 'react-native';
import type { GestureType } from 'react-native-gesture-handler';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';

import { PortfolioName } from '@mobile/entities/portfolio';
import { Cell, Draggable } from '@mobile/shared/ui';

import { DerivationReorderList } from '../DerivationReorderList';
import { styles } from './DraggablePortfolio.styles';
import { getDerivations } from './helpers';
import type { DraggablePortfolioProps } from './types';

export const GroupPortfolioItem = memo((props: DraggablePortfolioProps) => {
    const {
        portfolio,
        itemsCount,
        gap,
        engine,
        activePortfolioId,
        activeDerivationIndex,
        onReorder,
        onMeasure,
        handleSelect
    } = props;

    const derivations = getDerivations(portfolio);
    const isActivePortfolio = activePortfolioId.isEq(portfolio.id);

    const groupPanRef = useRef<GestureType | undefined>(undefined);
    const groupTapRef = useRef<GestureType | undefined>(undefined);
    const blockExternalRefs = useMemo(() => [groupPanRef, groupTapRef], []);

    return (
        <Draggable
            id={portfolio.id.toString()}
            itemsCount={itemsCount}
            gap={gap}
            engine={engine}
            onReorder={onReorder}
            onMeasure={onMeasure}
            activationDelay={150}
            onPress={() => handleSelect(portfolio, derivations[0]?.index)}
            panRef={groupPanRef}
            tapRef={groupTapRef}
        >
            {({ gesture, underlayStyle }) => (
                <GestureDetector gesture={gesture}>
                    <View>
                        <Animated.View style={underlayStyle} />
                        <Cell style={styles.item}>
                            <Cell.Content>
                                <Cell.Row style={styles.row}>
                                    <PortfolioName
                                        meta={portfolio.meta}
                                        gap={12}
                                        size={16}
                                        type={portfolio.type}
                                    />
                                </Cell.Row>
                            </Cell.Content>
                        </Cell>
                        <DerivationReorderList
                            portfolio={portfolio}
                            derivations={derivations}
                            isActivePortfolio={isActivePortfolio}
                            activeDerivationIndex={activeDerivationIndex}
                            blockExternalRefs={blockExternalRefs}
                            onSelectDerivation={derivationIndex =>
                                handleSelect(portfolio, derivationIndex)
                            }
                        />
                    </View>
                </GestureDetector>
            )}
        </Draggable>
    );
});
