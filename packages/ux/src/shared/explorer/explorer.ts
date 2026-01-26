import { useMemo } from 'react';

import { useBootConfig } from '../api';

export interface BtcExplorer {
    walletUrl(address: string): string;
    transactionUrl(txid: string): string;
}

export function useBtcExplorer(): BtcExplorer {
    const { blockchains } = useBootConfig();
    const config = blockchains.bitcoin.mainnet;

    return useMemo(
        () => ({
            walletUrl: (address: string) =>
                config.explorer_account_url.replace('{address}', address),
            transactionUrl: (txid: string) => config.explorer_tx_url.replace('{txid}', txid)
        }),
        [config]
    );
}
