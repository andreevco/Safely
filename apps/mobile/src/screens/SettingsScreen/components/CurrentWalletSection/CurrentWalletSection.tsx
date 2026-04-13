import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { PortfolioType } from '@safely/core';
import { useActivePortfolio } from '@safely/ux';

import { RootStackNavigationProp } from '@mobile/app/navigation/types';
import { PortfolioName } from '@mobile/entities/portfolio';
import { Button, Cell, List } from '@mobile/shared/ui';

import { styles } from './CurrentWalletSection.styles';

export const CurrentWalletSection = () => {
    const { t } = useTranslation();
    const activePortfolio = useActivePortfolio();
    const navigation = useNavigation<RootStackNavigationProp>();

    const handleEditPress = () => {
        navigation.navigate('CustomizeWalletModal', {
            portfolio: activePortfolio,
            onCompleteCustomize: () => {
                navigation.pop();
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
                                isWatchOnly={activePortfolio.type === PortfolioType.WATCH_ONLY}
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
