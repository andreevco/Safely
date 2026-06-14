import { View } from 'react-native';

import {
    Checkmark16,
    CircularSpinner,
    ExclamationmarkCircle16,
    Icon,
    Text
} from '@mobile/shared/ui';

import { styles } from './LedgerSignSteps.styles';

export type LedgerStepStatus = 'pending' | 'active' | 'done' | 'error';

export type LedgerSignStep = {
    label: string;
    status: LedgerStepStatus;
};

const StepIndicator = ({ status }: { status: LedgerStepStatus }) => {
    switch (status) {
        case 'active':
            return <CircularSpinner size={16} />;
        case 'done':
            return <Icon icon={Checkmark16} color="accentGreen" />;
        case 'error':
            return <Icon icon={ExclamationmarkCircle16} color="accentOrange" />;
        case 'pending':
        default:
            return <View style={styles.dot} />;
    }
};

interface Props {
    steps: LedgerSignStep[];
}

export const LedgerSignSteps = ({ steps }: Props) => (
    <View style={styles.container}>
        {steps.map(step => (
            <View key={step.label} style={styles.row}>
                <View style={styles.indicator}>
                    <StepIndicator status={step.status} />
                </View>
                <Text variant="bodyM" color={step.status === 'done' ? 'accentGreen' : 'primary'}>
                    {step.label}
                </Text>
            </View>
        ))}
    </View>
);
