import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { useCallback, useLayoutEffect, useRef } from 'react';
import { useSharedValue } from 'react-native-reanimated';

import { Portfolio } from '@safely/core';
import { useReorderPortfolios, useSetActivePortfolio } from '@safely/ux';

import { DraggablePortfolio } from './components';

interface PortfoliosListProps {
    portfolios: Portfolio[];
    onSelect: () => void;
    onCustomize?: () => void;
    variant?: 'compact';
}

export const PortfoliosList = (props: PortfoliosListProps) => {
    const { portfolios, onSelect, variant } = props;
    const { mutate: reorderPortfolios } = useReorderPortfolios();
    const { mutate: setActivePortfolio } = useSetActivePortfolio();

    const draggedIndex = useSharedValue<number | null>(null);
    const offsetY = useSharedValue(0);

    const pendingDragReset = useRef(false);

    useLayoutEffect(() => {
        if (pendingDragReset.current) {
            pendingDragReset.current = false;
            draggedIndex.value = null;
            offsetY.value = 0;
        }
    }, [portfolios, draggedIndex, offsetY]);

    const handleSelect = useCallback(
        (portfolio: Portfolio) => {
            void impactAsync(ImpactFeedbackStyle.Medium);
            onSelect();
            requestAnimationFrame(() => setActivePortfolio({ id: portfolio.id }));
        },
        [setActivePortfolio, onSelect]
    );

    const handleDragStart = useCallback(() => {
        pendingDragReset.current = false;
    }, []);

    const moveItem = useCallback(
        (fromIndex: number, toIndex: number) => {
            const newPortfolios = [...portfolios];
            const clampedToIndex = Math.max(0, Math.min(toIndex, newPortfolios.length - 1));

            newPortfolios.splice(clampedToIndex, 0, newPortfolios.splice(fromIndex, 1)[0]);

            pendingDragReset.current = true;
            reorderPortfolios(newPortfolios);
        },
        [portfolios, reorderPortfolios]
    );

    return portfolios.map((portfolio, index) => {
        return (
            <DraggablePortfolio
                key={portfolio.id.toString()}
                portfolio={portfolio}
                index={index}
                itemsCount={portfolios.length}
                draggedIndex={draggedIndex}
                offsetY={offsetY}
                moveItem={moveItem}
                handleSelect={handleSelect}
                handleDragStart={handleDragStart}
                variant={variant}
            />
        );
    });
};
