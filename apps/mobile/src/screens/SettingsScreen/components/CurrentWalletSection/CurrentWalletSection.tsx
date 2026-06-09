import { useNavigation } from '@react-navigation/core';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useActivePortfolio } from '@safely/ux';

import { PortfolioName } from '@mobile/entities/portfolio';
import { Button, Cell, List } from '@mobile/shared/ui';

import { styles } from './CurrentWalletSection.styles';

export const CurrentWalletSection = () => {
    const { t } = useTranslation();
    const activePortfolio = useActivePortfolio();
    const navigation = useNavigation();
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    const nativeStackNavigation = useNavigation<NativeStackNavigationProp<{}>>();

    const handleEditPress = () => {
        navigation.navigate('CustomizeWalletModal', {
            portfolio: activePortfolio,
            onCompleteCustomize: () => {
                nativeStackNavigation.pop();
            }
        });
    };

    return (
        <List>
            <List.Title>{t('settings.groups.currentWallet.title')}</List.Title>
            <List.Group variant="divided">
                <Cell onPress={handleEditPress}>
                    <Cell.Content>
                        <Cell.Row>
                            <PortfolioName
                                meta={activePortfolio.meta}
                                fontVariant="labelL"
                                gap={12}
                                size={16}
                                type={activePortfolio.type}
                            />
                            <Cell.Value variant="bodyL" color="tertiary">
                                {t('common.edit')}
                            </Cell.Value>
                        </Cell.Row>
                    </Cell.Content>
                </Cell>
            </List.Group>
            <View style={styles.buttonContainer}>
                <Button
                    type="secondary"
                    size="small"
                    onPress={() => navigation.navigate('AddWalletModal')}
                >
                    {t('addWallet.title')}
                </Button>
            </View>
        </List>
    );
};
