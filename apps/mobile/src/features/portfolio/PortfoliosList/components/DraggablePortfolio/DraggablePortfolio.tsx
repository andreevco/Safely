import { memo, useMemo } from 'react';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { SharedValue } from 'react-native-reanimated';

import { Portfolio } from '@safely/core';
import { useActivePortfolio, useNumberFormatter, usePortfolioBalance } from '@safely/ux';

import { PortfolioName } from '@mobile/entities/portfolio';
import { Cell, Draggable, Text } from '@mobile/shared/ui';

import { styles } from './DraggablePortfolio.styles';

type DraggablePortfolioProps = {
    portfolio: Portfolio;
    index: number;
    itemsCount: number;
    draggedIndex: SharedValue<number | null>;
    offsetY: SharedValue<number>;
    moveItem: (fromIndex: number, toIndex: number) => void;
    handleSelect: (portfolio: Portfolio) => void;
    handleDragStart?: () => void;
    variant?: 'compact';
};

export const DraggablePortfolio = memo((props: DraggablePortfolioProps) => {
    const {
        portfolio,
        index,
        itemsCount,
        draggedIndex,
        offsetY,
        moveItem,
        handleSelect,
        handleDragStart,
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
            gap={variant === 'compact' ? 0 : 2}
            key={portfolio.id.toString()}
            index={index}
            itemCount={itemsCount}
            draggedIndex={draggedIndex}
            offsetY={offsetY}
            moveItem={moveItem}
            activationDelay={150}
            onPress={() => handleSelect(portfolio)}
            onDragStart={handleDragStart}
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
                                <PortfolioName meta={portfolio.meta} gap={12} size={16} />
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
