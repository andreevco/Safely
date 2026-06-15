import { useNavigation } from '@react-navigation/core';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { PortfolioType } from '@safely/core';
import {
    useActivePortfolio,
    useActivePortfolioEntities,
    useActiveWalletMeta,
    useIsActivePortfolioOverview,
    useUpdateDerivationMeta
} from '@safely/ux';

import { PortfolioName } from '@mobile/entities/portfolio';
import { Button, Cell, List } from '@mobile/shared/ui';

import { styles } from './CurrentWalletSection.styles';

export const CurrentWalletSection = () => {
    const { t } = useTranslation();
    const activePortfolio = useActivePortfolio();
    const entities = useActivePortfolioEntities();
    const activeWalletMeta = useActiveWalletMeta();
    const isOverview = useIsActivePortfolioOverview();
    const { mutateAsync: updateDerivationMeta } = useUpdateDerivationMeta();
    const navigation = useNavigation();
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    const nativeStackNavigation = useNavigation<NativeStackNavigationProp<{}>>();

    const derivationTarget =
        entities.type === 'bip39' &&
        entities.portfolio.type === PortfolioType.LEDGER &&
        !entities.isOverview
            ? { portfolio: entities.portfolio, derivation: entities.derivation }
            : null;

    const handleEditPress = () => {
        if (derivationTarget) {
            const { portfolio, derivation } = derivationTarget;
            const fallbackName = t('portfolio.ledgerWallet', { number: derivation.index + 1 });

            navigation.navigate('CustomizeWalletModal', {
                hasBackButton: true,
                initialMeta: { name: derivation.name ?? fallbackName, icon: derivation.icon },
                onSave: async meta => {
                    await updateDerivationMeta({
                        portfolio,
                        derivationIndex: derivation.index,
                        name: meta.name === fallbackName ? undefined : meta.name,
                        icon: meta.icon
                    });

                    nativeStackNavigation.pop();
                },
                onCompleteCustomize: () => nativeStackNavigation.pop()
            });

            return;
        }

        navigation.navigate('CustomizeWalletModal', {
            portfolio: activePortfolio,
            onCompleteCustomize: () => {
                nativeStackNavigation.pop();
            }
        });
    };

    return (
        <List>
            <List.Title>
                {isOverview
                    ? t('settings.groups.currentWallet.ledgerTitle')
                    : t('settings.groups.currentWallet.title')}
            </List.Title>
            <List.Group variant="divided">
                <Cell onPress={handleEditPress}>
                    <Cell.Content>
                        <Cell.Row>
                            <PortfolioName
                                meta={activeWalletMeta}
                                fontVariant="labelL"
                                gap={12}
                                size={16}
                                tag={
                                    derivationTarget
                                        ? derivationTarget.derivation.index + 1
                                        : undefined
                                }
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
