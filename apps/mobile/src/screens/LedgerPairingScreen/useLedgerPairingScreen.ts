import { DeviceModelId } from '@ledgerhq/device-management-kit';
import { useNavigation } from '@react-navigation/core';
import { StackActions } from '@react-navigation/native';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { ImageSourcePropType } from 'react-native';

import type { LedgerStep, LedgerStepStatus } from '@mobile/features/ledger';
import { getLedgerImage, useLedgerPairing, useLedgerSession } from '@mobile/features/ledger';

const SUCCESS_DELAY_MS = 1_000;

const MODEL_LABEL: Partial<Record<DeviceModelId, string>> = {
    [DeviceModelId.STAX]: 'Stax',
    [DeviceModelId.FLEX]: 'Flex',
    [DeviceModelId.NANO_X]: 'Nano X',
    [DeviceModelId.NANO_S]: 'Nano S'
};

type LedgerPairingScreenState = {
    image: ImageSourcePropType;
    title: string;
    subtitle: string;
    steps: LedgerStep[];
};

export const useLedgerPairingScreen = (): LedgerPairingScreenState => {
    const { t } = useTranslation();
    const navigation = useNavigation();
    const { selectedDevice } = useLedgerSession();
    const { status, failedStep } = useLedgerPairing();

    const modelLabel = selectedDevice ? (MODEL_LABEL[selectedDevice.deviceModel.model] ?? '') : '';

    useEffect(() => {
        if (status === 'connected') {
            const timer = setTimeout(
                () => navigation.dispatch(StackActions.replace('LedgerPairingSuccessModal')),
                SUCCESS_DELAY_MS
            );

            return () => clearTimeout(timer);
        }

        if (status === 'error') {
            navigation.dispatch(StackActions.replace('LedgerPairingUnsuccessModal'));
        }
    }, [status, navigation]);

    const currentStep = status === 'connecting' ? 0 : status === 'openingApp' ? 1 : 2;

    const stepStatus = (index: number): LedgerStepStatus => {
        if (status === 'error') {
            if (index < failedStep) {
                return 'done';
            }

            return index === failedStep ? 'error' : 'pending';
        }

        if (index < currentStep) {
            return 'done';
        }

        return index === currentStep ? 'active' : 'pending';
    };

    return {
        image: getLedgerImage(selectedDevice?.deviceModel.model),
        title: t('addWallet.connectLedger.pairing.title', { device: modelLabel }).trim(),
        subtitle: t('addWallet.connectLedger.pairing.subtitle'),
        steps: [
            { label: t('addWallet.connectLedger.pairing.steps.connect'), status: stepStatus(0) },
            { label: t('addWallet.connectLedger.pairing.steps.openApp'), status: stepStatus(1) }
        ]
    };
};
