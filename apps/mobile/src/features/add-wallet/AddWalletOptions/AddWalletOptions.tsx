import { Cell, List, TouchableOpacity } from '@mobile/shared/ui';
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
                <TouchableOpacity onPress={startCreateFlow}>
                    <Cell>
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
                </TouchableOpacity>
                <TouchableOpacity onPress={startImportFlow}>
                    <Cell>
                        <Cell.Content>
                            <Cell.Row>
                                <Cell.Title>{t('addWallet.importExisting.title')}</Cell.Title>
                            </Cell.Row>
                            <Cell.Row>
                                <Cell.Subtitle>
                                    {t('addWallet.importExisting.subtitle')}
                                </Cell.Subtitle>
                            </Cell.Row>
                        </Cell.Content>
                        <Cell.Chevron />
                    </Cell>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => Alert.alert('Coming soon')}>
                    <Cell>
                        <Cell.Content>
                            <Cell.Row>
                                <Cell.Title>{t('addWallet.watchAccount.title')}</Cell.Title>
                            </Cell.Row>
                            <Cell.Row>
                                <Cell.Subtitle>
                                    {t('addWallet.watchAccount.subtitle')}
                                </Cell.Subtitle>
                            </Cell.Row>
                        </Cell.Content>
                        <Cell.Chevron />
                    </Cell>
                </TouchableOpacity>
            </List.Group>
        </List>
    );
};
