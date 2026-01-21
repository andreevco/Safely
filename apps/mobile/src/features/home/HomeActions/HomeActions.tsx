import { Actions } from '@mobile/shared/ui';
import { ArrowDown28, ArrowTop28, QrCodeScan28 } from '@mobile/shared/ui/Icon';
import { useTranslation } from 'react-i18next';

import { styles } from './HomeActions.styles';

export const HomeActions = () => {
    const { t } = useTranslation();
    return (
        <Actions style={styles.container}>
            <Actions.Button title={t('home.actions.send')} icon={ArrowTop28} onPress={() => {}} />
            <Actions.Button
                title={t('home.actions.receive')}
                icon={ArrowDown28}
                onPress={() => {}}
            />
            <Actions.Button title={t('home.actions.scan')} icon={QrCodeScan28} onPress={() => {}} />
        </Actions>
    );
};
