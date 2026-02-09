import { Cell, List } from '@mobile/shared/ui';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { useAddWalletFlow } from '../useAddWalletFlow';
import { styles } from './AddWalletOptions.styles';

export const AddWalletOptions = () => {
    const { t } = useTranslation();
    const { startCreateFlow, startImportFlow } = useAddWalletFlow();

    return (
        <List style={styles.list}>
            <List.Group variant="separated">
                <Cell onPress={startCreateFlow}>
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
                <Cell onPress={startImportFlow}>
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
                <Cell onPress={() => Alert.alert('Coming soon')}>
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
            </List.Group>
        </List>
    );
};
