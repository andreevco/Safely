import { Icon, Placeholder96, Text } from '@mobile/shared/ui';
import { setStringAsync } from 'expo-clipboard';
import { TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-skia';

import { styles } from './QRCodeBlock.styles';

type QRCodeBlockProps = {
    address: string;
};

export const QRCodeBlock = (props: QRCodeBlockProps) => {
    const { address } = props;

    const handleCopyAddress = () => {
        setStringAsync(address);
        console.log('Address copied to clipboard');
    };

    return (
        <View style={styles.content}>
            <View style={styles.qrCodeContainer}>
                <QRCode
                    shapeOptions={{
                        shape: 'square',
                        eyePatternShape: 'square'
                    }}
                    logoAreaSize={66}
                    // TODO: Replace with asset logo
                    logo={<Icon icon={Placeholder96} size={48} color="constantBlack" />}
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
