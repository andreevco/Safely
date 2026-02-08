import { ActivityItem } from '@mobile/entities/activity';
import { View } from 'react-native';

import { useHistory } from '@safely/ux';

export const HistoryList = () => {
    const history = useHistory();

    if (!history.data) {
        return null;
    }

    return (
        <View>
            {history.data.pages[0].items.map(item => (
                <ActivityItem key={item.key} activity={item} />
            ))}
        </View>
    );
};
