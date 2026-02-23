import { StaticScreenProps } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { type CryptoAsset } from '@safely/core';
import { useReceiveInfo } from '@safely/ux';

import { Screen, Text } from '@mobile/shared/ui';

import { QRCodeBlock } from './components/QRCodeBlock/QRCodeBlock';
import { ReceiveActions } from './components/ReceiveActions';
import { styles } from './ReceiveAssetModal.styles';

type ReceiveAssetModalProps = StaticScreenProps<{
    asset: CryptoAsset;
}>;

export const ReceiveAssetModal = (props: ReceiveAssetModalProps) => {
    const {
        route: {
            params: { asset }
        }
    } = props;
    const { t } = useTranslation();

    const receiveInfo = useReceiveInfo();

    return (
        <Screen>
            <Screen.Header>
                <Screen.Header.Title />
                <Screen.Header.CloseButton />
            </Screen.Header>
            <Screen.Content>
                <View style={styles.textContainer}>
                    <Text textAlign="center" variant="titleM">
                        {t('receiveAsset.title', { symbol: asset.symbol })}
                    </Text>
                    <Text textAlign="center" variant="bodyL" color="secondary">
                        {t('receiveAsset.description', { name: asset.name })}
                    </Text>
                </View>
                <QRCodeBlock address={receiveInfo.displayAddress} asset={asset} />
                <ReceiveActions address={receiveInfo.displayAddress} />
            </Screen.Content>
        </Screen>
    );
};
