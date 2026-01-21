import { HomeActions } from '@mobile/features/home';
import { Cell, Screen } from '@mobile/shared/ui';
import { ArrowDown28 } from '@mobile/shared/ui/Icon';

export const HomeScreen = () => {
    return (
        <Screen>
            <Screen.Header variant="center">
                <Screen.Header.Title>Title</Screen.Header.Title>
            </Screen.Header>
            <Screen.Scrollable>
                <HomeActions />
                <Cell>
                    <Cell.Image type="icon" icon={ArrowDown28} />
                    <Cell.Content>
                        <Cell.Row>
                            <Cell.Title>Bitcoin</Cell.Title>
                            <Cell.Value>$125,693</Cell.Value>
                        </Cell.Row>
                        <Cell.Row>
                            <Cell.Subtitle>$93,274</Cell.Subtitle>
                            <Cell.Subvalue>0.7421 BTC</Cell.Subvalue>
                        </Cell.Row>
                    </Cell.Content>
                </Cell>
            </Screen.Scrollable>
        </Screen>
    );
};
