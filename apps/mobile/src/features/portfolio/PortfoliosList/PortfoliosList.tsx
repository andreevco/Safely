import { useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue } from 'react-native-reanimated';

import { Portfolio } from '@safely/core';
import { useActivePortfolio, useReorderPortfolios, useSetActivePortfolio } from '@safely/ux';

import { RootStackNavigationProp } from '@mobile/app/navigation/types';
import { PortfolioName } from '@mobile/entities/portfolio/PortfolioName/PortfolioName';
import { Cell, Dots14, Draggable, Icon } from '@mobile/shared/ui';

import { styles } from './PortfoliosList.styles';

interface PortfoliosListProps {
    portfolios: Portfolio[];
    onSelect: () => void;
    onCustomize?: () => void;
    variant?: 'compact';
}

export const PortfoliosList = (props: PortfoliosListProps) => {
    const { portfolios, onSelect, onCustomize, variant } = props;
    const activePortfolio = useActivePortfolio();
    const { mutate: reorderPortfolios } = useReorderPortfolios();
    const { mutate: setActivePortfolio } = useSetActivePortfolio();
    const navigation = useNavigation<RootStackNavigationProp<'SelectAccountModal'>>();

    const draggedIndex = useSharedValue<number | null>(null);
    const offsetY = useSharedValue(0);

    const [orderedPortfolios, setOrderedPortfolios] = useState(portfolios);
    const pendingDragReset = useRef(false);

    styles.useVariants({ variant });

    useEffect(() => {
        setOrderedPortfolios(portfolios);
    }, [portfolios]);

    useLayoutEffect(() => {
        if (pendingDragReset.current) {
            pendingDragReset.current = false;
            draggedIndex.value = null;
            offsetY.value = 0;
        }
    }, [orderedPortfolios, draggedIndex, offsetY]);

    const handleSelect = useCallback(
        (portfolio: Portfolio) => {
            setActivePortfolio({ id: portfolio.id }, { onSuccess: onSelect });
        },
        [setActivePortfolio, onSelect]
    );

    const handleCustomizeWallet = useCallback(
        (portfolio: Portfolio) => {
            onCustomize?.();
            navigation.navigate('CustomizeWalletModal', {
                portfolio,
                onCompleteCustomize: () => {
                    navigation.goBack();
                }
            });
        },
        [navigation, onCustomize]
    );

    const moveItem = useCallback(
        (fromIndex: number, toIndex: number) => {
            const newPortfolios = [...orderedPortfolios];
            const clampedToIndex = Math.max(0, Math.min(toIndex, newPortfolios.length - 1));

            newPortfolios.splice(clampedToIndex, 0, newPortfolios.splice(fromIndex, 1)[0]);

            pendingDragReset.current = true;
            setOrderedPortfolios(newPortfolios);
            reorderPortfolios(newPortfolios);
        },
        [orderedPortfolios, reorderPortfolios]
    );

    return orderedPortfolios.map((portfolio, index) => {
        const isActive = activePortfolio.id.isEq(portfolio.id);
        const handlePress = isActive ? undefined : () => handleSelect(portfolio);

        return (
            <Draggable
                gap={variant === 'compact' ? 0 : 2}
                key={portfolio.id.toString()}
                index={index}
                itemCount={orderedPortfolios.length}
                draggedIndex={draggedIndex}
                offsetY={offsetY}
                moveItem={moveItem}
            >
                {({ panGesture }) => (
                    <GestureDetector gesture={panGesture}>
                        <Cell
                            style={styles.portfolioItem}
                            containerStyle={styles.portfolioItemContainer}
                            onPress={handlePress}
                            showDivider={
                                variant === 'compact'
                                    ? index !== orderedPortfolios.length - 1
                                    : false
                            }
                            onLongPress={() => handleCustomizeWallet(portfolio)}
                        >
                            <Cell.Content>
                                <Cell.Row>
                                    <PortfolioName meta={portfolio.meta} gap={12} size={16} />
                                </Cell.Row>
                            </Cell.Content>
                            <Animated.View key="checkmark">
                                {activePortfolio.id.isEq(portfolio.id) && <Cell.Checkmark />}
                            </Animated.View>
                            {orderedPortfolios.length > 1 && (
                                <Icon icon={Dots14} style={styles.dotsIcon} color="tertiary" />
                            )}
                        </Cell>
                    </GestureDetector>
                )}
            </Draggable>
        );
    });
};
