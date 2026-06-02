import { FlashList } from '@shopify/flash-list';

import { useProvidersQuery } from '@safely/ux';

import { ProviderCell, ProviderCellSkeleton } from '@mobile/entities/exchange';
import { List } from '@mobile/shared/ui';

import { styles } from './ProvidersList.styles';

export const ProvidersList = () => {
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

    return (
        <FlashList
            data={data?.providers ?? []}
            contentContainerStyle={styles.list}
            renderItem={({ index, item }) => (
                <ProviderCell
                    provider={item}
                    showDivider={index !== (data?.providers?.length ?? 0) - 1}
                />
            )}
        />
    );
};
