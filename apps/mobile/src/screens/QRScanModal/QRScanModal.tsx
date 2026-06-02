import type { StaticScreenProps } from '@react-navigation/native';
import { useFocusEffect, useIsFocused, useNavigation } from '@react-navigation/native';
import { notificationAsync, NotificationFeedbackType } from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { LayoutChangeEvent, LayoutRectangle } from 'react-native';
import { useWindowDimensions } from 'react-native';
import Animated, { useSharedValue } from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';
import type { ScannedObject } from 'react-native-vision-camera';
import {
    Camera,
    isScannedCode,
    useCameraDevice,
    useCameraPermission,
    useObjectOutput
} from 'react-native-vision-camera';

import type { RootStackNavigationProp } from '@mobile/shared/navigation/types';
import { Screen, Text } from '@mobile/shared/ui';

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

    const handleObjectsScanned = useCallback(
        async (objects: ScannedObject[]) => {
            const code = objects.find(isScannedCode);

            if (!code || !code.value) {
                return;
            }

            if (scanningTimeoutId.current) {
                clearTimeout(scanningTimeoutId.current);
            }

            const minSize = 128;

            const { boundingBox } = code;

            const cameraWidth = boundingBox.height * cameraLayout.value.width;
            const cameraHeight = boundingBox.width * cameraLayout.value.height;

            const x =
                cameraLayout.value.width - cameraWidth - boundingBox.y * cameraLayout.value.width;

            const y = boundingBox.x * cameraLayout.value.height;

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

    const objectOutput = useObjectOutput({
        types: ['qr'],
        onObjectsScanned: handleObjectsScanned
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
                torchMode={isLightOn ? 'on' : 'off'}
                onLayout={handleCameraLayout}
                style={StyleSheet.absoluteFill}
                device={device}
                outputs={[objectOutput]}
                isActive={isFocused}
                onStarted={() => setIsLightOn(prev => !prev)}
            />
            <CameraMask barcodeValues={barcodeValues} />
            <Screen.Header>
                <Screen.Header.Title />
                <Screen.Header.CloseButton />
            </Screen.Header>
            <Screen.Content>
                <Animated.View style={styles.textContainer}>
                    <Text textAlign="center" variant="titleM" color="constantWhite">
                        {title}
                    </Text>
                    {subtitle ? (
                        <Text
                            style={styles.subtitle}
                            textAlign="center"
                            variant="bodyL"
                            color="constantWhite"
                        >
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
