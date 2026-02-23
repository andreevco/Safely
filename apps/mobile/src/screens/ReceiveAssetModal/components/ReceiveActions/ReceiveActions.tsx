import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Share } from 'react-native';

import { Actions, ArrowTop28, Copy28 } from '@mobile/shared/ui';
import { useCopy } from '@mobile/shared/utils/copy';

import { styles } from './ReceiveActions.styles';

type ReceiveActionsProps = {
    address: string;
};

export const ReceiveActions = (props: ReceiveActionsProps) => {
    const { address } = props;

    const { t } = useTranslation();

    const copy = useCopy();

    const handleCopyAddress = useCallback(() => {
        copy(address);
    }, [copy, address]);

    const handleShareAddress = useCallback(() => {
        Share.share({
            message: address
        });
    }, [address]);

    return (
        <Actions style={styles.container}>
            <Actions.Button
                title={t('receiveAsset.actions.copy')}
                icon={Copy28}
                onPress={handleCopyAddress}
            />
            <Actions.Button
                title={t('receiveAsset.actions.share')}
                icon={ArrowTop28}
                onPress={handleShareAddress}
            />
        </Actions>
    );
};
