import { useCallback } from 'react';
import { TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-skia';

import { type CryptoAsset } from '@safely/core';

import { Text, Image } from '@mobile/shared/ui';
import { useCopy } from '@mobile/shared/utils/copy';

import { styles } from './QRCodeBlock.styles';

type QRCodeBlockProps = {
    address: string;
    asset: CryptoAsset;
};

export const QRCodeBlock = (props: QRCodeBlockProps) => {
    const { address, asset } = props;
    const copy = useCopy();

    const handleCopyAddress = useCallback(() => {
        copy(address);
    }, [copy, address]);

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
        </View>
    );
};
