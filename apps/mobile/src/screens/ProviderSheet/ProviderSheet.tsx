import type { StaticScreenProps } from '@react-navigation/native';

import type { Provider } from '@safely/core';

import { Screen, Text } from '@mobile/shared/ui';

export type ProviderSheetProps = StaticScreenProps<{
    provider: Provider;
}>;

export const ProviderSheet = ({
    route: {
        params: { provider }
    }
}: ProviderSheetProps) => {
    return (
        <Screen>
            <Screen.Header shortHeader>
                <Screen.Header.Title />
                <Screen.Header.CloseButton />
            </Screen.Header>
            <Screen.Content>
                <Text>{provider.info.name}</Text>
            </Screen.Content>
        </Screen>
    );
};
