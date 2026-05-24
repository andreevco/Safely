import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { Portfolio } from '@safely/core';
import { useReorderPortfolios, useSetActivePortfolio } from '@safely/ux';

import { DraggablePortfolio } from './components';

interface PortfoliosListProps {
    portfolios: Portfolio[];
    onSelect: () => void;
    onCustomize?: () => void;
    variant?: 'compact';
}

const buildPositions = (portfolios: Portfolio[]): Record<string, number> => {
    const positions: Record<string, number> = {};

    portfolios.forEach((portfolio, index) => {
        positions[portfolio.id.toString()] = index;
    });

    return positions;
};

export const PortfoliosList = (props: PortfoliosListProps) => {
    const { portfolios, onSelect, variant } = props;
    const { mutate: reorderPortfolios } = useReorderPortfolios();
    const { mutate: setActivePortfolio } = useSetActivePortfolio();

    const gap = variant === 'compact' ? 0 : 2;
    const itemsCount = portfolios.length;

    const positions = useSharedValue<Record<string, number>>(buildPositions(portfolios));
    const activeId = useSharedValue<string | null>(null);
    const draggedOffsetY = useSharedValue(0);
    const rowHeight = useSharedValue(48);

    const portfoliosRef = useRef(portfolios);
    portfoliosRef.current = portfolios;

    const idsSignature = useMemo(
        () => portfolios.map(p => p.id.toString()).join('|'),
        [portfolios]
    );

    useEffect(() => {
        if (activeId.value !== null) return;

        const next = buildPositions(portfoliosRef.current);
        const current = positions.value;
        const sameOrder =
            Object.keys(next).length === Object.keys(current).length &&
            Object.keys(next).every(id => current[id] === next[id]);

        if (sameOrder) return;

        positions.value = next;
    }, [idsSignature, positions, activeId]);

    const handleSelect = useCallback(
        (portfolio: Portfolio) => {
            void impactAsync(ImpactFeedbackStyle.Medium);
            onSelect();
            requestAnimationFrame(() => setActivePortfolio({ id: portfolio.id }));
        },
        [setActivePortfolio, onSelect]
    );

    const handleReorder = useCallback(
        (nextOrderIds: string[]) => {
            if (nextOrderIds.length !== portfolios.length) return;

            const byId = new Map(portfolios.map(p => [p.id.toString(), p]));
            const next = nextOrderIds.map(id => byId.get(id)).filter(p => p !== undefined);

            reorderPortfolios(next);
        },
        [portfolios, reorderPortfolios]
    );

    const handleMeasure = useCallback(
        (height: number) => {
            if (height > 0 && rowHeight.value !== height) rowHeight.value = height;
        },
        [rowHeight]
    );

    const containerStyle = useAnimatedStyle(() => {
        const stride = rowHeight.value + gap;

        return {
            height: itemsCount > 0 ? itemsCount * stride - gap : 0
        };
    });

    return (
        <Animated.View style={containerStyle}>
            {portfolios.map((portfolio, index) => {
                return (
                    <DraggablePortfolio
                        key={portfolio.id.toString()}
                        portfolio={portfolio}
                        index={index}
                        itemsCount={itemsCount}
                        gap={gap}
                        positions={positions}
                        activeId={activeId}
                        draggedOffsetY={draggedOffsetY}
                        rowHeight={rowHeight}
                        onReorder={handleReorder}
                        onMeasure={handleMeasure}
                        handleSelect={handleSelect}
                        variant={variant}
                    />
                );
            })}
        </Animated.View>
    );
};
