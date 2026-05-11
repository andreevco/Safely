import { useMemo } from 'react';

import type { BLOCKCHAIN_NAME, BtcExplorer, Explorer } from '@safely/core';
import { ExplorerFactory } from '@safely/core';

import { useBootConfig } from '../../shared';

export function useExplorerFactory(): ExplorerFactory {
    const { blockchains } = useBootConfig();

    return useMemo(() => new ExplorerFactory(blockchains), [blockchains]);
}

export function useExplorer(blockchain: BLOCKCHAIN_NAME.BTC): BtcExplorer;
export function useExplorer(blockchain: BLOCKCHAIN_NAME): Explorer {
    const factory = useExplorerFactory();

    return useMemo(() => factory.createExplorer(blockchain), [factory, blockchain]);
}
