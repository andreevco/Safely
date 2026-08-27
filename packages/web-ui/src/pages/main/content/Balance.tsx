import type { FC } from 'react';

import { useNumberFormatter, useTotalBalance, useTranslate } from '@safely/ux';

import { actionsStyles, rowStyles } from './Balance.styles';
import { Button, Text } from '../../../shared';

export type BalanceProps = {
    onSend: () => void;
};

export const Balance: FC<BalanceProps> = props => {
    const t = useTranslate();
    const { data: totalBalance } = useTotalBalance();
    const formatter = useNumberFormatter();

    return (
        <div className={rowStyles}>
            <Text variant="titleL">{totalBalance?.format(formatter) ?? '—'}</Text>

            <div className={actionsStyles}>
                <Button variant="secondary" size="small" onClick={props.onSend}>
                    {t('home.actions.send')}
                </Button>
                <Button variant="secondary" size="small" onClick={() => undefined}>
                    {t('home.actions.receive')}
                </Button>
            </div>
        </div>
    );
};
