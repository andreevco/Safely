import { View } from 'react-native';

import { Text } from '../Text';
import { styles } from './StepsList.styles';

export type Step = {
    title: string;
    description?: string;
};

export const StepsList = ({ steps }: { steps: Step[] }) => {
    return (
        <View style={styles.container}>
            {steps.map((step, index) => (
                <View key={step.title} style={styles.row}>
                    <View style={styles.number}>
                        <Text variant="bodyM" color="tertiary" monospace>
                            {index + 1}.
                        </Text>
                    </View>
                    <View style={styles.text}>
                        <Text variant="bodyM" color="primary">
                            {step.title}
                        </Text>
                        {step.description ? (
                            <Text variant="bodyM" color="tertiary">
                                {step.description}
                            </Text>
                        ) : null}
                    </View>
                </View>
            ))}
        </View>
    );
};
