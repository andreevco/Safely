import type { FC } from 'react';

import { ellipsisMiddle } from '@safely/core';
import {
    useActiveBtcWallet,
    useActiveWalletMeta,
    useNumberFormatter,
    useTotalBalance,
    useTranslate
} from '@safely/ux';

import {
    actionsStyles,
    balanceRowStyles,
    headerStyles,
    walletRowStyles,
    walletTitleStyles
} from './MainContent.styles';
import { centeredContentStyles } from './MainLayout.styles';
import { WalletIcon } from '../../entities';
import { Button, Text } from '../../shared';

export const MainContent: FC = () => {
    const t = useTranslate();
    const { data: totalBalance } = useTotalBalance();
    const wallet = useActiveBtcWallet();
    const activeMeta = useActiveWalletMeta();
    const formatter = useNumberFormatter();

    return (
        <>
            <div className={headerStyles}>
                <div className={walletRowStyles}>
                    <div className={walletTitleStyles}>
                        <WalletIcon icon={activeMeta.icon} size="medium" />
                        <Text variant="labelL">{activeMeta.name}</Text>
                    </div>
                    <Text variant="bodyM" tone="secondary">
                        {ellipsisMiddle(wallet.address, 6)}
                    </Text>
                </div>

                <div className={balanceRowStyles}>
                    <Text variant="titleL">{totalBalance?.format(formatter) ?? '—'}</Text>

                    <div className={actionsStyles}>
                        <Button variant="secondary" size="small" onClick={() => undefined}>
                            {t('home.actions.send')}
                        </Button>
                        <Button variant="secondary" size="small" onClick={() => undefined}>
                            {t('home.actions.receive')}
                        </Button>
                    </div>
                </div>
            </div>

            <div className={centeredContentStyles}>
                <Text variant="labelL">{t('history.empty.title')}</Text>
                <Text variant="bodyM" tone="secondary" align="center">
                    {t('history.empty.subtitle')}
                </Text>
            </div>
        </>
    );
};
