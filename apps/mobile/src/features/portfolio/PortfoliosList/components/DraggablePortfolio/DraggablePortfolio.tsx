import { useMemo } from 'react';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { SharedValue } from 'react-native-reanimated';

import { Portfolio, PortfolioType } from '@safely/core';
import { useActivePortfolio, useNumberFormatter, usePortfolioBalance } from '@safely/ux';

import { PortfolioName } from '@mobile/entities/portfolio';
import { Cell, Draggable, Text } from '@mobile/shared/ui';

import { styles } from './DraggablePortfolio.styles';

type DraggablePortfolioProps = {
    portfolio: Portfolio;
    index: number;
    portfolios: Portfolio[];
    draggedIndex: SharedValue<number | null>;
    offsetY: SharedValue<number>;
    moveItem: (fromIndex: number, toIndex: number) => void;
    handleSelect: (portfolio: Portfolio) => void;
    handleDragStart: () => void;
    variant?: 'compact';
};

export const DraggablePortfolio = (props: DraggablePortfolioProps) => {
    const {
        portfolio,
        index,
        portfolios,
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

    styles.useVariants({ variant });

    return (
        <Draggable
            gap={variant === 'compact' ? 0 : 2}
            key={portfolio.id.toString()}
            index={index}
            itemCount={portfolios.length}
            draggedIndex={draggedIndex}
            offsetY={offsetY}
            moveItem={moveItem}
            activationDelay={120}
            onPress={() => handleSelect(portfolio)}
            onDragStart={handleDragStart}
        >
            {({ gesture, underlayStyle }) => (
                <GestureDetector gesture={gesture}>
                    <Cell
                        background={
                            activePortfolio.id.isEq(portfolio.id) ? 'tertiary' : 'secondary'
                        }
                        style={styles.item}
                        containerStyle={styles.itemContainer}
                        showDivider={
                            variant === 'compact' ? index !== portfolios.length - 1 : false
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
                                    color="tertiary"
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
};
