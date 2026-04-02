import { useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import QRCode from 'react-native-qrcode-skia';

import { type CryptoAsset } from '@safely/core';
import { useIsActiveWalletWatchOnly } from '@safely/ux';

import { RootStackNavigationProp } from '@mobile/app/navigation/types';
import { Badge, Text, Image, TouchableOpacity } from '@mobile/shared/ui';
import { useCopy } from '@mobile/shared/utils/copy';

import { styles } from './QRCodeBlock.styles';

type QRCodeBlockProps = {
    address: string;
    asset: CryptoAsset;
};

export const QRCodeBlock = (props: QRCodeBlockProps) => {
    const { address, asset } = props;
    const copy = useCopy();
    const { t } = useTranslation();
    const navigation = useNavigation<RootStackNavigationProp>();
    const isWatchOnly = useIsActiveWalletWatchOnly();

    const handleCopyAddress = useCallback(() => {
        copy(address);
    }, [copy, address]);

    const handleWatchOnlyPress = useCallback(() => {
        navigation.navigate('WatchOnlySheet');
    }, [navigation]);

    return (
        <View style={styles.content}>
            <View style={styles.qrCodeContainer}>
                <QRCode
                    shapeOptions={{
                        shape: 'square',
                        eyePatternShape: 'square'
                    }}
                    logoAreaSize={66}
                    logo={<Image source={asset.image} style={styles.logo} />}
                    value={address}
                    size={198}
                />
            </View>
            <TouchableOpacity onPress={handleCopyAddress}>
                <Text
                    textAlign="center"
                    style={styles.address}
                    variant="bodyLMono"
                    color="constantBlack"
                >
                    {address}
                </Text>
            </TouchableOpacity>
            {isWatchOnly && (
                <Pressable style={styles.badgeContainer} onPress={handleWatchOnlyPress}>
                    <Badge type="warningFilled" isUppercase>
                        {t('portfolio.watchOnly')}
                    </Badge>
                </Pressable>
            )}
        </View>
    );
};
