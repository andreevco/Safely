import { Screen, Text } from '@mobile/shared/ui';
import { View } from 'react-native';

import { AccountSelector } from './components';

type HomeHeaderProps = {
    onNavigateToSelectAccount: () => void;
};

export const HomeHeader = (props: HomeHeaderProps) => {
    const { onNavigateToSelectAccount } = props;

    return (
        <Screen.Header>
            <View>
                <Text>after merge</Text>
            </View>
            <AccountSelector onNavigateToSelectAccount={onNavigateToSelectAccount} />
            <View>
                <Text>after merge</Text>
            </View>
        </Screen.Header>
    );
};
