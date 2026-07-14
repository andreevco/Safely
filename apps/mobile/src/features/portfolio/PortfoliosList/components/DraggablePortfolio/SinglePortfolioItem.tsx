import { memo, useMemo } from 'react';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';

import { resolveBtcWallet, useBtcWalletFiatBalance, useNumberFormatter } from '@safely/ux';

import { PortfolioName } from '@mobile/entities/portfolio';
import { Cell, Draggable, Text } from '@mobile/shared/ui';

import { styles } from './DraggablePortfolio.styles';
import type { DraggablePortfolioProps } from './types';

const SKELETON_BASE_WIDTH = 42;

export const SinglePortfolioItem = memo((props: DraggablePortfolioProps) => {
    const {
        portfolio,
        index,
        itemsCount,
        gap,
        engine,
        activePortfolioId,
        onReorder,
        onMeasure,
        handleSelect,
        variant
    } = props;

    const { data: balance } = useBtcWalletFiatBalance(resolveBtcWallet(portfolio));

    const formatter = useNumberFormatter();
    const skeletonWidth = useMemo(
        () => SKELETON_BASE_WIDTH + Math.floor(Math.random() * 4) * 2,
        []
    );
    const isSelected = activePortfolioId.isEq(portfolio.id);

    styles.useVariants({ variant });

    return (
        <Draggable
            id={portfolio.id.toString()}
            itemsCount={itemsCount}
            gap={gap}
            engine={engine}
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
                                    type={portfolio.type}
                                    networkType={portfolio.networkType}
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
