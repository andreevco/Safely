import type { ISyncAccount, ITreeStorage } from '@safely/sync';
import { MKDerivationDomain } from '@safely/sync';

import { formatBytesAsUuid } from '../utils/uuid';

export async function deriveAnalyticsAccountUuid(
    account: ISyncAccount<never>,
    secureEncryptedStorage: ITreeStorage
): Promise<string> {
    const rootSeedKey = await account.deriveKeyFromMasterKey(
        MKDerivationDomain.ANALYTICS_ID,
        secureEncryptedStorage
    );

    return formatBytesAsUuid(rootSeedKey, 5);
}
