import { useMemo } from 'react';

import type { RequestSigner } from '@safely/core';
import { PortfolioType, ReadOnlyRequestSigner } from '@safely/core';

import { useAppContext, SecretEncryptor } from '../../shared';
import { useActiveAccount } from '../account';
import { useActivePortfolio } from '../portfolio';

export function useReadOnlyRequestSigner(): RequestSigner | undefined {
    const account = useActiveAccount();
    const portfolio = useActivePortfolio();
    const { storage } = useAppContext();

    const portfolioKey = portfolio.id.toString();

    return useMemo(() => {
        if (portfolio.type !== PortfolioType.BIP39) return undefined;

        return new ReadOnlyRequestSigner(async () => {
            using secureStorage = storage.sync.getSecureEncrypted();
            // skips security check for UX reason. We use it to sign requests with read-only credentials.
            secureStorage.UNSAFE_SKIP_SECURITY_CHECK_unlock();
            const encryptor = new SecretEncryptor(account.secretEncryptor, secureStorage);
            return await portfolio.createReadOnlyCredential(encryptor);
        });
    }, [portfolioKey, account.secretEncryptor, storage]);
}
