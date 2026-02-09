import { useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { FiatAsset } from '@safely/core';
import { useActiveFiat, useAvailableFiats, useSetActiveFiat } from '@safely/ux';

import { RootStackNavigationProp } from '@mobile/app/navigation/types';
import { Cell, List, Screen, Text } from '@mobile/shared/ui';
import { Checkmark28, Icon } from '@mobile/shared/ui/Icon';

import { styles } from './CurrencyScreen.styles';

export const CurrencyScreen = () => {
    const { t } = useTranslation();
    const navigation = useNavigation<RootStackNavigationProp>();

    const activeFiat = useActiveFiat();
    const setActiveFiat = useSetActiveFiat();
    const availableFiats = useAvailableFiats();

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

    return (
        <Screen>
            <Screen.Header variant="left">
                <Screen.Header.Title>{t('currency.title')}</Screen.Header.Title>
                <Screen.Header.CloseButton />
            </Screen.Header>
            <Screen.Scrollable contentContainerStyle={styles.listContent}>
                <List style={styles.container}>
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
                </List>
            </Screen.Scrollable>
        </Screen>
    );
};
