import { useNavigation } from '@react-navigation/core';
import type { StaticScreenProps } from '@react-navigation/native';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { notificationAsync, NotificationFeedbackType } from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { LayoutChangeEvent, LayoutRectangle } from 'react-native';
import { Platform, useWindowDimensions } from 'react-native';
import Animated, { useSharedValue } from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';
import type { CameraOrientation, Frame } from 'react-native-vision-camera';
import {
    Camera,
    useCameraDevice,
    useCameraPermission,
    useFrameOutput
} from 'react-native-vision-camera';
import type { Barcode, Point } from 'react-native-vision-camera-barcode-scanner';
import { useBarcodeScanner } from 'react-native-vision-camera-barcode-scanner';
import { scheduleOnRN } from 'react-native-worklets';

import { useAppContext } from '@safely/ux';

import { Screen, Text } from '@mobile/shared/ui';

import { CameraMask, FlashlightToggle } from './components';
import { NoCameraFound } from './components/NoCameraFound';
import { PermissionRequest } from './components/PermissionRequest';
import { styles } from './QRScanModal.styles';

const SCAN_SUCCESS_DELAY_MS = 200;
const MASK_INSET = 32;

type Rect = { x: number; y: number; width: number; height: number };

// The two platforms provide Barcode coordinates in different spaces:
//  - Android: points are already in the rotated up-right image space
//    so we just normalize by the up-right dimensions.
//  - iOS: points are in the raw sensor buffer (landscape) space, so we
//    normalize by the buffer dimensions and counter-rotate by the orientation.
const toUprightNormalized = (
    px: number,
    py: number,
    frameWidth: number,
    frameHeight: number,
    uprightWidth: number,
    uprightHeight: number,
    orientation: CameraOrientation,
    isMirrored: boolean
) => {
    'worklet';
    if (Platform.OS === 'android') {
        return { ux: px / uprightWidth, uy: py / uprightHeight };
    }

    let nx = px / frameWidth;
    const ny = py / frameHeight;

    if (isMirrored) {
        nx = 1 - nx;
    }

    if (orientation === 'down') {
        return { ux: 1 - nx, uy: 1 - ny };
    }
    if (orientation === 'left') {
        return { ux: 1 - ny, uy: nx };
    }
    if (orientation === 'right') {
        return { ux: ny, uy: 1 - nx };
    }
    return { ux: nx, uy: ny };
};

const getCornerPoints = (code: Barcode): Point[] => {
    'worklet';
    if (code.cornerPoints.length > 0) {
        return code.cornerPoints;
    }

    const { left, top, right, bottom } = code.boundingBox;
    return [
        { x: left, y: top },
        { x: right, y: top },
        { x: right, y: bottom },
        { x: left, y: bottom }
    ];
};

const toViewRect = (points: Point[], frame: Frame, viewWidth: number, viewHeight: number) => {
    'worklet';
    const { width: frameWidth, height: frameHeight, orientation, isMirrored } = frame;

    if (viewWidth <= 0 || viewHeight <= 0 || frameWidth <= 0 || frameHeight <= 0) {
        return null;
    }

    const isRotated = orientation === 'left' || orientation === 'right';
    const uprightWidth = isRotated ? frameHeight : frameWidth;
    const uprightHeight = isRotated ? frameWidth : frameHeight;

    const scale = Math.max(viewWidth / uprightWidth, viewHeight / uprightHeight);
    const displayWidth = uprightWidth * scale;
    const displayHeight = uprightHeight * scale;
    const offsetX = (viewWidth - displayWidth) / 2;
    const offsetY = (viewHeight - displayHeight) / 2;

    const corners = points.map(point => {
        const { ux, uy } = toUprightNormalized(
            point.x,
            point.y,
            frameWidth,
            frameHeight,
            uprightWidth,
            uprightHeight,
            orientation,
            isMirrored
        );

        return { x: offsetX + ux * displayWidth, y: offsetY + uy * displayHeight };
    });

    const xs = corners.map(corner => corner.x);
    const ys = corners.map(corner => corner.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);

    return {
        x: minX,
        y: minY,
        width: Math.max(...xs) - minX,
        height: Math.max(...ys) - minY
    };
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export type QRScanModalProps = StaticScreenProps<{
    onSuccess: (value: string) => void;
    onClose?: () => void;
    title: string;
    subtitle?: string;
}>;

export const QRScanModal = (props: QRScanModalProps) => {
    const { onSuccess, onClose, title, subtitle } = props.route.params;

    const { logger } = useAppContext();
    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const { width, height } = useWindowDimensions();

    const device = useCameraDevice('back');
    const { hasPermission, requestPermission } = useCameraPermission();
    const scanner = useBarcodeScanner({ barcodeFormats: ['qr-code'] });

    const [isLightOn, setIsLightOn] = useState(false);

    const scanningTimeoutId = useRef<NodeJS.Timeout | null>(null);
    const cancelledRef = useRef(false);
    const completedRef = useRef(false);

    const barcodeValues = useSharedValue<Rect>({
        x: width / 2,
        y: height / 2,
        width: 0,
        height: 0
    });
    const cameraLayout = useSharedValue<LayoutRectangle>({ x: 0, y: 0, width: 0, height: 0 });
    const isProcessing = useSharedValue(false);

    useFocusEffect(
        useCallback(() => {
            return () => {
                if (scanningTimeoutId.current) {
                    clearTimeout(scanningTimeoutId.current);
                }
                if (!completedRef.current) {
                    cancelledRef.current = true;
                    onClose?.();
                }
            };
        }, [onClose])
    );

    useEffect(() => {
        if (!hasPermission) {
            requestPermission();
        }
    }, [hasPermission, requestPermission]);

    const handleError = useCallback(
        (message: string) => {
            logger.error('[QRScanModal] Barcode scanner error', new Error(message));
        },
        [logger]
    );

    const handleCodeFound = useCallback(
        async (value: string) => {
            if (scanningTimeoutId.current) {
                clearTimeout(scanningTimeoutId.current);
            }

            await delay(SCAN_SUCCESS_DELAY_MS);
            if (cancelledRef.current) {
                return;
            }
            notificationAsync(NotificationFeedbackType.Success);
            await delay(SCAN_SUCCESS_DELAY_MS);
            if (cancelledRef.current) {
                return;
            }
            completedRef.current = true;
            onSuccess(value);
            navigation.goBack();
        },
        [onSuccess, navigation]
    );

    const frameOutput = useFrameOutput({
        pixelFormat: 'yuv',
        onFrame: useCallback(
            (frame: Frame) => {
                'worklet';
                try {
                    const code = scanner
                        .scanCodes(frame)
                        .find(barcode => barcode.format === 'qr-code');

                    if (!code || !code.displayValue) {
                        return;
                    }

                    const rect = toViewRect(
                        getCornerPoints(code),
                        frame,
                        cameraLayout.value.width,
                        cameraLayout.value.height
                    );

                    if (rect) {
                        barcodeValues.value = rect;
                    }

                    if (!isProcessing.value) {
                        isProcessing.value = true;
                        scheduleOnRN(handleCodeFound, code.displayValue);
                    }
                } catch (error) {
                    scheduleOnRN(handleError, String(error));
                } finally {
                    frame.dispose();
                }
            },
            [scanner, barcodeValues, cameraLayout, isProcessing, handleCodeFound, handleError]
        )
    });

    const handleCameraLayout = useCallback(
        (event: LayoutChangeEvent) => {
            const { width: cameraWidth, height: cameraHeight } = event.nativeEvent.layout;
            cameraLayout.value = event.nativeEvent.layout;

            const size = cameraWidth - MASK_INSET * 2;
            barcodeValues.value = {
                x: Math.round((cameraWidth - size) / 2),
                y: Math.round((cameraHeight - size) / 2),
                width: size,
                height: size
            };
        },
        [barcodeValues, cameraLayout]
    );

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
                outputs={[frameOutput]}
                isActive={isFocused}
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
