import { Image } from 'expo-image';
import { useCallback } from 'react';
import { TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-skia';

import { resources } from '@mobile/shared/resources';
import { Text } from '@mobile/shared/ui';
import { useCopy } from '@mobile/shared/utils/copy';

import { styles } from './QRCodeBlock.styles';

type QRCodeBlockProps = {
    address: string;
};

export const QRCodeBlock = (props: QRCodeBlockProps) => {
    const { address } = props;
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
                    logo={<Image source={resources.btcLogo} style={styles.logo} />}
                    value={address}
                    size={198}
                />
            </View>
            <TouchableOpacity onPress={handleCopyAddress}>
                <Text
                    textAlign="center"
                    style={styles.address}
                    monospace
                    variant="bodyL"
                    color="constantBlack"
                >
                    {address}
                </Text>
            </TouchableOpacity>
        </View>
    );
};
