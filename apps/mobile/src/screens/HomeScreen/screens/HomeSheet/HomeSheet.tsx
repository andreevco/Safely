import { Screen, BottomSheet, Text } from '@mobile/shared/ui';

export const HomeSheet = () => {
    return (
        <BottomSheet>
            <Screen>
                <Screen.Header variant="left">
                    <Screen.Header.Title>Home Sheet</Screen.Header.Title>
                    <Screen.Header.CloseButton />
                </Screen.Header>
                <Screen.Content>
                    <Text>Home Sheet</Text>
                </Screen.Content>
            </Screen>
        </BottomSheet>
    );
};
