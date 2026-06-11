import { useNavigation } from '@react-navigation/core';
import { CommonActions } from '@react-navigation/native';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useAppContext } from '@safely/ux';

import { TEST_ID } from '@mobile/shared/constants';
import { Cell, List } from '@mobile/shared/ui';

import { useAddWalletFlow } from '../useAddWalletFlow';
import { styles } from './AddWalletOptions.styles';

export const AddWalletOptions = () => {
    const { t } = useTranslation();
    const navigation = useNavigation();
    const { devIsTestnetAllowed } = useAppContext();
    const { startCreateFlow, startImportFlow, startTestnetImportFlow } = useAddWalletFlow();

    const startWatchOnlyFlow = useCallback(() => {
        navigation.dispatch(CommonActions.navigate('AddWatchOnlyModal'));
    }, [navigation]);

    return (
        <List style={styles.list}>
            <List.Group variant="separated">
                <Cell testID={TEST_ID.addWallet.createNew} onPress={startCreateFlow}>
                    <Cell.Content>
                        <Cell.Row>
                            <Cell.Title>{t('addWallet.createNew.title')}</Cell.Title>
                        </Cell.Row>
                        <Cell.Row>
                            <Cell.Subtitle>{t('addWallet.createNew.subtitle')}</Cell.Subtitle>
                        </Cell.Row>
                    </Cell.Content>
                    <Cell.Chevron />
                </Cell>
                <Cell testID={TEST_ID.addWallet.importExisting} onPress={startImportFlow}>
                    <Cell.Content>
                        <Cell.Row>
                            <Cell.Title>{t('addWallet.importExisting.title')}</Cell.Title>
                        </Cell.Row>
                        <Cell.Row>
                            <Cell.Subtitle>{t('addWallet.importExisting.subtitle')}</Cell.Subtitle>
                        </Cell.Row>
                    </Cell.Content>
                    <Cell.Chevron />
                </Cell>
                <Cell testID={TEST_ID.addWallet.watchAccount} onPress={startWatchOnlyFlow}>
                    <Cell.Content>
                        <Cell.Row>
                            <Cell.Title>{t('addWallet.watchAccount.title')}</Cell.Title>
                        </Cell.Row>
                        <Cell.Row>
                            <Cell.Subtitle>{t('addWallet.watchAccount.subtitle')}</Cell.Subtitle>
                        </Cell.Row>
                    </Cell.Content>
                    <Cell.Chevron />
                </Cell>
                {devIsTestnetAllowed && (
                    <Cell testID={TEST_ID.addWallet.testnet} onPress={startTestnetImportFlow}>
                        <Cell.Content>
                            <Cell.Row>
                                <Cell.Title>{t('addWallet.testnet.title')}</Cell.Title>
                            </Cell.Row>
                            <Cell.Row>
                                <Cell.Subtitle>{t('addWallet.testnet.subtitle')}</Cell.Subtitle>
                            </Cell.Row>
                        </Cell.Content>
                        <Cell.Chevron />
                    </Cell>
                )}
            </List.Group>
        </List>
    );
};
