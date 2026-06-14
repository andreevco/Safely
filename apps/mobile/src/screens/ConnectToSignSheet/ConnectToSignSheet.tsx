import { useSelector } from '@xstate/react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import type { LedgerSigningActor } from '@mobile/features/ledger';
import { LEDGER_FAILURE_STATES, useLedgerSigning } from '@mobile/features/ledger';
import { BottomSheet, Button, Icon, LedgerLogo96, Text, useBottomSheet } from '@mobile/shared/ui';

import { LedgerSignSteps, type LedgerStepStatus } from './components/LedgerSignSteps';
import { styles } from './ConnectToSignSheet.styles';

interface Props {
    actor: LedgerSigningActor;
}

const ConnectToSignContent = ({ actor }: Props) => {
    const { t } = useTranslation();
    const { close } = useBottomSheet();

    const value = useSelector(actor, snapshot => snapshot.value);
    const step = useSelector(actor, snapshot => snapshot.context.step);
    const deviceName = useSelector(actor, snapshot => snapshot.context.selectedDevice?.name);
    const isDone = useSelector(actor, snapshot => snapshot.status === 'done');

    const isFailed = LEDGER_FAILURE_STATES.includes(value);

    useEffect(() => {
        if (isDone) {
            close();
        }
    }, [isDone, close]);

    const stepStatus = (index: number): LedgerStepStatus => {
        if (index < step) {
            return 'done';
        }

        if (index === step) {
            return isFailed ? 'error' : 'active';
        }

        return 'pending';
    };

    const steps = [
        {
            label: t('ledgerSign.steps.connect', {
                device: deviceName ?? t('ledgerSign.deviceFallback')
            }),
            status: stepStatus(0)
        },
        { label: t('ledgerSign.steps.openApp'), status: stepStatus(1) },
        { label: t('ledgerSign.steps.approve'), status: stepStatus(2) }
    ];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Icon icon={LedgerLogo96} />
                <View style={styles.textContainer}>
                    <Text variant="titleM" textAlign="center">
                        {t('ledgerSign.title')}
                    </Text>
                    <Text variant="bodyL" color="secondary" textAlign="center">
                        {t('ledgerSign.subtitle')}
                    </Text>
                </View>
            </View>

            <LedgerSignSteps steps={steps} />

            <View style={styles.buttons}>
                <View style={styles.buttonItem}>
                    <Button
                        type="secondary"
                        size="large"
                        onPress={() => actor.send({ type: 'CANCEL' })}
                    >
                        {t('ledgerSign.cancel')}
                    </Button>
                </View>
                {isFailed && (
                    <View style={styles.buttonItem}>
                        <Button
                            type="primary"
                            size="large"
                            onPress={() => actor.send({ type: 'RETRY' })}
                        >
                            {t('ledgerSign.retry')}
                        </Button>
                    </View>
                )}
            </View>
        </View>
    );
};

export const ConnectToSignSheet = () => {
    const { activeActor } = useLedgerSigning();

    const handleClose = () => {
        if (activeActor && activeActor.getSnapshot().status !== 'done') {
            activeActor.send({ type: 'CANCEL' });
        }
    };

    return (
        <BottomSheet onClose={handleClose}>
            {activeActor ? <ConnectToSignContent actor={activeActor} /> : <View />}
        </BottomSheet>
    );
};
