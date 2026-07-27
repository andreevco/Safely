import { useNavigation } from '@react-navigation/core';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import type { FiatAsset } from '@safely/core';
import type { MainBalanceUnit } from '@safely/ux';
import {
    useActiveFiat,
    useAvailableFiats,
    useMainBalanceUnit,
    useSetActiveFiat,
    useSetMainBalanceUnit
} from '@safely/ux';

import { Cell, List, Screen, Text } from '@mobile/shared/ui';
import { Checkmark28, Icon } from '@mobile/shared/ui/Icon';

import { styles } from './CurrencyScreen.styles';

const MAIN_BALANCE_UNITS: MainBalanceUnit[] = ['fiat', 'crypto'];

export const CurrencyScreen = () => {
    const { t } = useTranslation();
    const navigation = useNavigation();

    const activeFiat = useActiveFiat();
    const setActiveFiat = useSetActiveFiat();
    const availableFiats = useAvailableFiats();

    const mainBalanceUnit = useMainBalanceUnit();
    const setMainBalanceUnit = useSetMainBalanceUnit();

    const handlePress = useCallback(
        (fiat: FiatAsset) => () => {
            if (activeFiat.id.symbol !== fiat.id.symbol) {
                // TODO: persist the selection when sync is ready
                setActiveFiat.mutate(
                    { fiat },
                    {
                        onSuccess: () => {
                            navigation.goBack();
                        }
                    }
                );
            } else {
                navigation.goBack();
            }
        },
        [activeFiat, setActiveFiat, navigation]
    );

    const handleMainBalanceUnitPress = useCallback(
        (unit: MainBalanceUnit) => () => {
            setMainBalanceUnit(unit);
        },
        [setMainBalanceUnit]
    );

    return (
        <Screen>
            <Screen.Header variant="left">
                <Screen.Header.Title>{t('currency.title')}</Screen.Header.Title>
                <Screen.Header.CloseButton />
            </Screen.Header>
            <Screen.Scrollable contentContainerStyle={styles.listContent}>
                <List style={styles.container}>
                    <List.Title>{t('currency.localCurrency.title')}</List.Title>
                    <List.Group variant="divided">
                        {availableFiats.map(fiat => {
                            const isSelected = activeFiat.id.symbol === fiat.id.symbol;

                            return (
                                <Cell key={fiat.id.symbol} onPress={handlePress(fiat)}>
                                    <Cell.Content>
                                        <Cell.Row>
                                            <View style={styles.cellContent}>
                                                <Text
                                                    variant="labelL"
                                                    color="primary"
                                                    style={styles.cellSymbol}
                                                >
                                                    {fiat.id.symbol}
                                                </Text>
                                                <Text variant="bodyL" color="tertiary">
                                                    {fiat.name}
                                                </Text>
                                            </View>
                                        </Cell.Row>
                                    </Cell.Content>
                                    {isSelected && <Icon icon={Checkmark28} color="accent" />}
                                </Cell>
                            );
                        })}
                    </List.Group>
                    <List.Title>{t('currency.mainBalance.title')}</List.Title>
                    <List.Group variant="divided">
                        {MAIN_BALANCE_UNITS.map(unit => (
                            <Cell key={unit} onPress={handleMainBalanceUnitPress(unit)}>
                                <Cell.Content>
                                    <Cell.Row>
                                        <Cell.Title>
                                            {t(`currency.mainBalance.options.${unit}`)}
                                        </Cell.Title>
                                    </Cell.Row>
                                </Cell.Content>
                                {mainBalanceUnit === unit && (
                                    <Icon icon={Checkmark28} color="accent" />
                                )}
                            </Cell>
                        ))}
                    </List.Group>
                </List>
            </Screen.Scrollable>
        </Screen>
    );
};
