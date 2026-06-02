import { FlashList } from '@shopify/flash-list';

import { useProvidersQuery } from '@safely/ux';

import { ProviderCell } from '@mobile/entities/exchange';

import { styles } from './ProvidersList.styles';

export const ProvidersList = () => {
    const { data } = useProvidersQuery();

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
