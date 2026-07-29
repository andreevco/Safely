import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native-gesture-handler';

import { useProvidersQuery } from '@safely/ux';

import { ProviderCell, ProviderCellSkeleton } from '@mobile/entities/exchange';
import { List, Text } from '@mobile/shared/ui';

import { styles } from './ProvidersList.styles';

export const ProvidersList = () => {
    const { t } = useTranslation();
    const { data, isLoading } = useProvidersQuery();

    if (isLoading) {
        return (
            <List>
                <List.Group style={styles.list} variant="separated">
                    <ProviderCellSkeleton />
                    <ProviderCellSkeleton />
                </List.Group>
            </List>
        );
    }

    const providers = data?.providers ?? [];

    return (
        <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contentContainer}
        >
            <List>
                <List.Group style={styles.list} variant="separated">
                    {providers.map(provider => (
                        <ProviderCell key={provider.info.id} provider={provider} />
                    ))}
                </List.Group>
            </List>
            <Text style={styles.footer} variant="bodyM" color="secondary" textAlign="center">
                {t('exchange.availabilityVaries')}
            </Text>
        </ScrollView>
    );
};
