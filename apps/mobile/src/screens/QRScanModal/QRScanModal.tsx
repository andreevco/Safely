import { RootStackNavigationProp } from '@mobile/app/navigation/types';
import { Screen, Text } from '@mobile/shared/ui';
import {
    StaticScreenProps,
    useFocusEffect,
    useIsFocused,
    useNavigation
} from '@react-navigation/native';
import { notificationAsync, NotificationFeedbackType } from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, LayoutRectangle, useWindowDimensions } from 'react-native';
import Animated, { useSharedValue } from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';
import {
    Camera,
    Code,
    CodeScannerFrame,
    useCameraDevice,
    useCameraPermission,
    useCodeScanner
} from 'react-native-vision-camera';

import { CameraMask, FlashlightToggle } from './components';
import { NoCameraFound } from './components/NoCameraFound';
import { PermissionRequest } from './components/PermissionRequest';
import { styles } from './QRScanModal.styles';

export type QRScanModalProps = StaticScreenProps<{
    onSuccess: (value: string) => void;
    onClose?: () => void;
    title: string;
    subtitle?: string;
}>;

export const QRScanModal = (props: QRScanModalProps) => {
    const { onSuccess, onClose, title, subtitle } = props.route.params;
    const navigation = useNavigation<RootStackNavigationProp<'QRScanModal'>>();
    const isProcessingRef = useRef(false);
    const scanningTimeoutId = useRef<NodeJS.Timeout | null>(null);

    useFocusEffect(
        useCallback(() => {
            return () => {
                if (scanningTimeoutId.current) {
                    clearTimeout(scanningTimeoutId.current);
                }
                if (!isProcessingRef.current) {
                    onClose?.();
                }
            };
        }, [onClose])
    );

    const isFocused = useIsFocused();

    const { hasPermission, requestPermission } = useCameraPermission();

    useEffect(() => {
        if (!hasPermission) {
            requestPermission();
        }
    }, [hasPermission, requestPermission]);

    const [isLightOn, setIsLightOn] = useState(false);

    const device = useCameraDevice('back');

    const { width, height } = useWindowDimensions();

    const barcodeValues = useSharedValue({
        width: 0,
        height: 0,
        x: width / 2,
        y: height / 2
    });

    const cameraLayout = useSharedValue<LayoutRectangle>({
        x: 0,
        y: 0,
        width: 0,
        height: 0
    });

    const handleCodeScanned = useCallback(
        async (codes: Code[], frame: CodeScannerFrame) => {
            const code = codes[0];

            if (!code.frame || !code.value) {
                return;
            }

            if (scanningTimeoutId.current) {
                clearTimeout(scanningTimeoutId.current);
            }

            const minSize = 128;

            const cameraWidth = (code.frame.height / frame.height) * cameraLayout.value.width;
            const cameraHeight = (code.frame.width / frame.width) * cameraLayout.value.height;

            const x =
                cameraLayout.value.width -
                cameraWidth -
                (code.frame.y / frame.height) * cameraLayout.value.width;

            const y = (code.frame.x / frame.width) * cameraLayout.value.height;

            const centerX = x + cameraWidth / 2;
            const centerY = y + cameraHeight / 2;

            const finalWidth = Math.max(cameraWidth, minSize);
            const finalHeight = Math.max(cameraHeight, minSize);

            const finalX = centerX - finalWidth / 2;
            const finalY = centerY - finalHeight / 2;

            barcodeValues.value = {
                width: finalWidth,
                height: finalHeight,
                x: finalX,
                y: finalY
            };

            if (isProcessingRef.current) {
                return;
            }

            isProcessingRef.current = true;
            await new Promise(resolve => setTimeout(resolve, 200));
            notificationAsync(NotificationFeedbackType.Success);
            await new Promise(resolve => setTimeout(resolve, 200));
            onSuccess(code.value);
            navigation.goBack();

            scanningTimeoutId.current = setTimeout(() => {
                barcodeValues.value = {
                    width: 0,
                    height: 0,
                    x: width / 2,
                    y: height / 2
                };
            }, 200);
        },
        [barcodeValues, cameraLayout, navigation, onSuccess, width, height]
    );

    const handleCameraLayout = useCallback(
        (event: LayoutChangeEvent) => {
            cameraLayout.value = event.nativeEvent.layout;
            const cameraWidth = event.nativeEvent.layout.width;
            const cameraHeight = event.nativeEvent.layout.height;
            const size = cameraWidth - 32 * 2;

            const values = {
                width: size,
                height: size,
                x: Math.round((cameraWidth - size) / 2),
                y: Math.round((cameraHeight - size) / 2)
            };

            barcodeValues.value = values;
        },
        [barcodeValues, cameraLayout]
    );

    const codeScanner = useCodeScanner({
        codeTypes: ['qr'],
        onCodeScanned: handleCodeScanned
    });

    if (!hasPermission) {
        return <PermissionRequest />;
    }

    if (!device) {
        return <NoCameraFound />;
    }

    return (
        <Screen background="transparent">
            <Camera
                onLayout={handleCameraLayout}
                style={StyleSheet.absoluteFill}
                device={device}
                codeScanner={codeScanner}
                isActive={isFocused}
                torch={isLightOn ? 'on' : 'off'}
            />
            <CameraMask barcodeValues={barcodeValues} />
            <Screen.Header>
                <Screen.Header.Title />
                <Screen.Header.CloseButton />
            </Screen.Header>
            <Screen.Content>
                <Animated.View style={styles.textContainer}>
                    <Text textAlign="center" variant="titleM">
                        {title}
                    </Text>
                    {subtitle ? (
                        <Text textAlign="center" variant="bodyL" color="secondary">
                            {subtitle}
                        </Text>
                    ) : null}
                </Animated.View>
                {device.hasTorch && (
                    <FlashlightToggle active={isLightOn} onPress={() => setIsLightOn(!isLightOn)} />
                )}
            </Screen.Content>
        </Screen>
    );
};
