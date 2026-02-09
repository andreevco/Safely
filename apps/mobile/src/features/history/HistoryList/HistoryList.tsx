import { useMemo } from 'react';
import { View } from 'react-native';

import { type BtcActivityItem, useHistory } from '@safely/ux';

import { ActivityItem } from '@mobile/entities/activity';
import { Screen } from '@mobile/shared/ui';

import { styles } from './HistoryList.styles';

type HistoryListProps = {
    onNavigateToTransaction: (activity: BtcActivityItem) => void;
};
export const HistoryList = (props: HistoryListProps) => {
    const { onNavigateToTransaction } = props;
    const history = useHistory();

    const items = useMemo(
        () => history.data?.pages.flatMap(page => page.items) ?? [],
        [history.data]
    );

    if (!history.data) {
        return null;
    }

    return (
        <Screen.List
            contentContainerStyle={styles.contentContainer}
            onRefresh={history.refetch}
            refreshing={history.isRefetching}
            data={items}
            keyExtractor={item => item.key}
            onEndReached={history.fetchNextPage}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            onEndReachedThreshold={0.5}
            renderItem={({ item }) => (
                <ActivityItem
                    key={item.key}
                    activity={item}
                    onNavigateToTransaction={onNavigateToTransaction}
                />
            )}
        />
    );
};
