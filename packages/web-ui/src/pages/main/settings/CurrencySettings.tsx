import type { FC } from 'react';

import type { FiatAsset } from '@safely/core';
import { useActiveFiat, useAvailableFiats, useSetActiveFiat, useTranslate } from '@safely/ux';

import { currencyRowStyles, listStyles, symbolStyles } from './SettingsSection.styles';
import { Cell, List, PageHeader, Text } from '../../../shared';

export const CurrencySettings: FC = () => {
    const t = useTranslate();
    const activeFiat = useActiveFiat();
    const availableFiats = useAvailableFiats();
    const { mutate: setActiveFiat } = useSetActiveFiat();

    const selectFiat = (fiat: FiatAsset): void => {
        if (!activeFiat.id.isEq(fiat.id)) {
            setActiveFiat({ fiat });
        }
    };

    return (
        <>
            <PageHeader title={t('currency.title')} hasDivider />

            <List className={listStyles}>
                <List.Title>{t('currency.localCurrency.title')}</List.Title>
                <List.Group variant="separated">
                    {availableFiats.map(fiat => (
                        <Cell
                            key={fiat.id.symbol}
                            isSelected={activeFiat.id.isEq(fiat.id)}
                            onClick={() => selectFiat(fiat)}
                        >
                            <Cell.Content>
                                <div className={currencyRowStyles}>
                                    <Text variant="labelL" className={symbolStyles}>
                                        {fiat.id.symbol}
                                    </Text>
                                    <Text variant="bodyL" tone="tertiary">
                                        {fiat.name}
                                    </Text>
                                </div>
                            </Cell.Content>
                            {activeFiat.id.isEq(fiat.id) && <Cell.Checkmark />}
                        </Cell>
                    ))}
                </List.Group>
            </List>
        </>
    );
};
