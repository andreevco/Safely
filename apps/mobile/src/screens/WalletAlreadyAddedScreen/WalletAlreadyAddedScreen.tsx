import { CommonActions, StaticScreenProps, useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Portfolio } from '@safely/core';
import { useSetActivePortfolio } from '@safely/ux';

import { Button, Screen, Text } from '@mobile/shared/ui';

import { styles } from './WalletAlreadyAddedScreen.styles';

type WalletAlreadyAddedScreenProps = StaticScreenProps<{
    portfolio: Portfolio;
}>;

export const WalletAlreadyAddedScreen = (props: WalletAlreadyAddedScreenProps) => {
    const { portfolio } = props.route.params;
    const { t } = useTranslation();
    const navigation = useNavigation();
    const { mutateAsync: setActivePortfolio } = useSetActivePortfolio();

    const walletDisplayName =
        portfolio.meta.icon.type === 'emoji'
            ? `${portfolio.meta.icon.value} ${portfolio.meta.name}`
            : portfolio.meta.name;

    const handleOpen = useCallback(async () => {
        await setActivePortfolio(portfolio);
        navigation.dispatch(
            CommonActions.reset({
                index: 0,
                routes: [{ name: 'TabsNavigator' }]
            })
        );
    }, [navigation, setActivePortfolio, portfolio]);

    const handleEdit = useCallback(() => {
        navigation.dispatch(
            CommonActions.navigate('CustomizeWalletModal', {
                portfolio,
                onCompleteCustomize: async () => {
                    await setActivePortfolio(portfolio);
                    navigation.dispatch(
                        CommonActions.reset({
                            index: 0,
                            routes: [{ name: 'TabsNavigator' }]
                        })
                    );
                }
            })
        );
    }, [navigation, portfolio, setActivePortfolio]);

    return (
        <Screen>
            <Screen.Header variant="left">
                <Screen.Header.BackButton />
            </Screen.Header>
            <Screen>
                <View style={styles.container}>
                    <View style={styles.centerBlock}>
                        <Text variant="titleM" textAlign="center">
                            {t('walletAlreadyAdded.title', { name: walletDisplayName })}
                        </Text>
                        <Text variant="bodyL" color="secondary" textAlign="center">
                            {t('walletAlreadyAdded.subtitle')}
                        </Text>
                    </View>

                    <View style={styles.buttons}>
                        <Button type="primary" size="large" onPress={handleOpen}>
                            {t('walletAlreadyAdded.open')}
                        </Button>
                        <Button type="secondary" size="large" onPress={handleEdit}>
                            {t('walletAlreadyAdded.edit')}
                        </Button>
                    </View>
                </View>
            </Screen>
        </Screen>
    );
};
