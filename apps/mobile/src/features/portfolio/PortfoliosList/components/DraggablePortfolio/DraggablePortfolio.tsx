import { memo, useMemo } from 'react';
import { GestureDetector } from 'react-native-gesture-handler';
import type { SharedValue } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';

import type { Portfolio } from '@safely/core';
import { PortfolioType } from '@safely/core';
import { useActivePortfolio, useNumberFormatter, usePortfolioBalance } from '@safely/ux';

import { PortfolioName } from '@mobile/entities/portfolio';
import { Cell, Draggable, Text } from '@mobile/shared/ui';

import { styles } from './DraggablePortfolio.styles';

type DraggablePortfolioProps = {
    portfolio: Portfolio;
    index: number;
    itemsCount: number;
    gap: number;
    positions: SharedValue<Record<string, number>>;
    activeId: SharedValue<string | null>;
    draggedOffsetY: SharedValue<number>;
    rowHeight: SharedValue<number>;
    onReorder: (orderedIds: string[]) => void;
    onMeasure: (height: number) => void;
    handleSelect: (portfolio: Portfolio) => void;
    variant?: 'compact';
};

export const DraggablePortfolio = memo((props: DraggablePortfolioProps) => {
    const {
        portfolio,
        index,
        itemsCount,
        gap,
        positions,
        activeId,
        draggedOffsetY,
        rowHeight,
        onReorder,
        onMeasure,
        handleSelect,
        variant
    } = props;
    const activePortfolio = useActivePortfolio();
    const { data: balance } = usePortfolioBalance(portfolio);

    const formatter = useNumberFormatter();
    const skeletonWidth = useMemo(() => 42 + Math.floor(Math.random() * 4) * 2, []);
    const isSelected = activePortfolio.id.isEq(portfolio.id);

    styles.useVariants({ variant });

    return (
        <Draggable
            id={portfolio.id.toString()}
            itemsCount={itemsCount}
            gap={gap}
            positions={positions}
            activeId={activeId}
            draggedOffsetY={draggedOffsetY}
            rowHeight={rowHeight}
            onReorder={onReorder}
            onMeasure={onMeasure}
            activationDelay={150}
            onPress={() => handleSelect(portfolio)}
        >
            {({ gesture, underlayStyle }) => (
                <GestureDetector gesture={gesture}>
                    <Cell
                        background={isSelected ? 'tertiary' : 'secondary'}
                        style={styles.item}
                        containerStyle={styles.itemContainer}
                        showDivider={
                            !isSelected && variant === 'compact' ? index !== itemsCount - 1 : false
                        }
                    >
                        <Animated.View style={underlayStyle} />
                        <Cell.Content>
                            <Cell.Row style={styles.row}>
                                <PortfolioName
                                    meta={portfolio.meta}
                                    gap={12}
                                    size={16}
                                    isWatchOnly={portfolio.type === PortfolioType.WATCH_ONLY}
                                />
                                <Text
                                    variant="bodyM"
                                    color={isSelected ? 'secondary' : 'tertiary'}
                                    skeleton
                                    skeletonWidth={skeletonWidth}
                                    skeletonVariant="transparentElement"
                                >
                                    {balance?.format(formatter)}
                                </Text>
                            </Cell.Row>
                        </Cell.Content>
                    </Cell>
                </GestureDetector>
            )}
        </Draggable>
    );
});
