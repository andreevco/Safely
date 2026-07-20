import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';
import { useCallback, useMemo } from 'react';
import z from 'zod';

import type { PortfolioIdBip39, ReadOnlyCredential } from '@safely/core';
import { sha256PrefixString } from '@safely/core';

import { useAppContext } from '../../shared';
import { useActiveAccount } from '../account';

const sCachedReadOnlyCredential = z.object({
    reqSecretKey: z.string(),
    certHex: z.string()
});

export interface ReadOnlyCredentialCache {
    get(portfolioId: PortfolioIdBip39): Promise<ReadOnlyCredential | null>;
    set(portfolioId: PortfolioIdBip39, credential: ReadOnlyCredential): Promise<void>;
    remove(portfolioId: PortfolioIdBip39): Promise<void>;
}

export function useReadOnlyCredentialCache(): ReadOnlyCredentialCache {
    const { storage } = useAppContext();
    const { accountId } = useActiveAccount();

    const slot = useMemo(
        () => storage.sync.encrypted.child(['readOnlyCredential', accountId]),
        [storage, accountId]
    );

    const get = useCallback(
        async (portfolioId: PortfolioIdBip39): Promise<ReadOnlyCredential | null> => {
            const roJson = await slot.getItem(sha256PrefixString(portfolioId.toString()));
            if (!roJson) return null;

            const readOnlyCredential = sCachedReadOnlyCredential.safeParse(JSON.parse(roJson));
            if (!readOnlyCredential.success) return null;

            return {
                certHex: readOnlyCredential.data.certHex,
                reqSecretKey: hexToBytes(readOnlyCredential.data.reqSecretKey)
            };
        },
        [slot]
    );

    const set = useCallback(
        async (portfolioId: PortfolioIdBip39, credential: ReadOnlyCredential): Promise<void> => {
            await slot.setItem(
                sha256PrefixString(portfolioId.toString()),
                JSON.stringify({
                    reqSecretKey: bytesToHex(credential.reqSecretKey),
                    certHex: credential.certHex
                })
            );
        },
        [slot]
    );

    const remove = useCallback(
        async (portfolioId: PortfolioIdBip39): Promise<void> => {
            await slot.removeItem(sha256PrefixString(portfolioId.toString()));
        },
        [slot]
    );

    return useMemo(() => ({ get, set, remove }), [get, set, remove]);
}
