import { useMemo } from 'react';

import { BLOCKCHAIN_NAME, BtcExplorer, Explorer, ExplorerFactory } from '@safely/core';

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
