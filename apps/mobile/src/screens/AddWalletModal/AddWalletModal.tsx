import { AddWalletOptions } from '@mobile/features/add-wallet';
import { Screen } from '@mobile/shared/ui';

export const AddWalletModal = () => {
    return (
        <Screen>
            <Screen.Header>
                <Screen.Header.Title />
                <Screen.Header.CloseButton />
            </Screen.Header>
            <Screen.Content>
                <AddWalletOptions />
            </Screen.Content>
        </Screen>
    );
};
