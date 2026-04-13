import { FC, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, View } from 'react-native';

import { SendResult } from '@safely/core';
import { useExplorerFactory } from '@safely/ux';

import { TransactionCell } from '@mobile/screens/ConfirmationScreen/components';
import { Copy16, Globe16, Icon, Text, TouchableOpacity } from '@mobile/shared/ui';
import { useCopy } from '@mobile/shared/utils/copy';

import { styles } from './TransactionSendResult.styles';

export const TransactionSendResult: FC<{ sendResult: SendResult }> = ({ sendResult }) => {
    const { t } = useTranslation();
    const explorerFactory = useExplorerFactory();

    const handleCopy = useCopy();
    const handleOpen = useCallback(() => {
        const url = sendResult.toExplorerUrl(explorerFactory);
        void Linking.openURL(url);
    }, [sendResult, explorerFactory]);

    return (
        <>
            <TransactionCell
                title={t('confirmation.sendResult.status.title')}
                value={t('confirmation.sendResult.status.created.value')}
                subvalue={t('confirmation.sendResult.status.created.description')}
            />
            <TransactionCell
                title={t('confirmation.sendResult.transaction')}
                showDivider={false}
                value={
                    <View style={styles.transactionInfoContainer}>
                        <Text color="primary" variant="bodyM">
                            {sendResult.toString()}
                        </Text>
                        <View style={styles.iconsContainer}>
                            <TouchableOpacity hitSlop={12} onPress={handleOpen}>
                                <Icon icon={Globe16} color="secondary" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => handleCopy(sendResult.txId)}
                                hitSlop={12}
                            >
                                <Icon icon={Copy16} color="secondary" />
                            </TouchableOpacity>
                        </View>
                    </View>
                }
            />
        </>
    );
};
