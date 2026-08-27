import type { FC } from 'react';

import { ellipsisMiddle } from '@safely/core';
import { useActiveBtcWallet, useActiveWalletMeta } from '@safely/ux';

import { rowStyles, titleStyles } from './Header.styles';
import { WalletIcon } from '../../../entities';
import { Text } from '../../../shared';

export const Header: FC = () => {
    const wallet = useActiveBtcWallet();
    const walletMeta = useActiveWalletMeta();

    return (
        <div className={rowStyles}>
            <div className={titleStyles}>
                <WalletIcon icon={walletMeta.icon} size="medium" />
                <Text variant="labelL">{walletMeta.name}</Text>
            </div>
            <Text variant="bodyM" tone="secondary">
                {ellipsisMiddle(wallet.address, 6)}
            </Text>
        </div>
    );
};
