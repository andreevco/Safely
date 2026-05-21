import { useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import type { RootStackNavigationProp } from '@mobile/app/navigation/types';
import { AddWallet96, Button, Icon, Screen, Text } from '@mobile/shared/ui';

import { styles } from './HomeEmptyState.styles';

export const HomeEmptyState = () => {
    const { t } = useTranslation();
    const navigation = useNavigation<RootStackNavigationProp>();

    const handleAddWallet = useCallback(() => {
        navigation.navigate('AddWalletModal');
    }, [navigation]);

    return (
        <Screen.Content>
            <View style={styles.container}>
                <Pressable onPress={handleAddWallet}>
                    <Icon icon={AddWallet96} />
                </Pressable>
                <View style={styles.textContainer}>
                    <Text variant="titleM" textAlign="center">
                        {t('home.emptyState.title')}
                    </Text>
                    <Text variant="bodyL" textAlign="center" color="secondary">
                        {t('home.emptyState.subtitle')}
                    </Text>
                </View>
            </View>
            <View style={styles.button}>
                <Button type="primary" size="large" onPress={handleAddWallet}>
                    {t('addWallet.title')}
                </Button>
            </View>
        </Screen.Content>
    );
};
