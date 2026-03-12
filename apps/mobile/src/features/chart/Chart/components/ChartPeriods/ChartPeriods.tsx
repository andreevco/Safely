import { selectionAsync } from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Text, TouchableOpacity } from '@mobile/shared/ui';

import { styles } from './ChartPeriods.styles';
import { ChartPeriod } from '../../config';

type TabProps = {
    isActive: boolean;
    onSelect: () => void;
    label: string;
};

function Tab(props: TabProps) {
    const { isActive, onSelect, label } = props;

    styles.useVariants({ isActive });

    return (
        <TouchableOpacity onPress={onSelect} style={styles.tabContainer}>
            <View style={styles.tab}>
                <Text variant="bodyM" color="primary">
                    {label}
                </Text>
            </View>
        </TouchableOpacity>
    );
}

type ChartPeriodsProps = {
    selectedPeriod: ChartPeriod;
    onSelectPeriod: (period: ChartPeriod) => void;
};

export const ChartPeriods = (props: ChartPeriodsProps) => {
    const { selectedPeriod, onSelectPeriod } = props;
    const { t } = useTranslation();

    const handleSelectPeriod = (period: ChartPeriod) => {
        selectionAsync();
        onSelectPeriod(period);
    };

    return (
        <View style={styles.container}>
            {Object.values(ChartPeriod)
                .slice(0, -1)
                .map(period => (
                    <Tab
                        key={period}
                        isActive={selectedPeriod === period}
                        onSelect={() => handleSelectPeriod(period)}
                        label={t(`chart.periods.${period}`)}
                    />
                ))}
        </View>
    );
};
