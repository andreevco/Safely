import type { Portfolio } from '@safely/core';

import type { ReorderEngine } from '@mobile/shared/ui';

export type DraggablePortfolioProps = {
    portfolio: Portfolio;
    index: number;
    itemsCount: number;
    gap: number;
    engine: ReorderEngine;
    activePortfolioId: Portfolio['id'];
    activeDerivationIndex: number | undefined;
    onReorder: (orderedIds: string[]) => void;
    onMeasure: (id: string, height: number) => void;
    handleSelect: (portfolio: Portfolio, derivationIndex?: number) => void;
    variant?: 'compact';
};
