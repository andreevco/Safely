import { Icon, Placeholder96, Text } from '@mobile/shared/ui';
import { View } from 'react-native';
import QRCode from 'react-native-qrcode-skia';

import { styles } from './QRCodeBlock.styles';

type QRCodeBlockProps = {
    address: string;
};

export const QRCodeBlock = (props: QRCodeBlockProps) => {
    const { address } = props;

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
            <Text
                textAlign="center"
                style={styles.address}
                monospace
                variant="bodyL"
                color="constantBlack"
            >
                {address}
            </Text>
        </View>
    );
};
