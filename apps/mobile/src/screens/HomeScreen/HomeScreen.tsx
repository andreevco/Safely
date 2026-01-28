import { RootStackNavigationProp } from '@mobile/app/navigation/types';
import { CurrencyButton, HomeActions, SettingsButton } from '@mobile/features/home';
import { Banner, Cell, List, Screen, Switch } from '@mobile/shared/ui';
import { ArrowDown28 } from '@mobile/shared/ui/Icon';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';

import { styles } from './HomeScreen.styles';

export const HomeScreen = () => {
    const navigation = useNavigation<RootStackNavigationProp>();
    const [isOn, setIsOn] = useState(false);

    const handlePress = () => {
        setIsOn(!isOn);
    };

    const handleSettingsPress = () => {
        navigation.navigate('SettingsModal');
    };

    const handleCurrencyPress = () => {
        navigation.navigate('CurrencyModal');
    };

    return (
        <Screen>
            <Screen.Header variant="center">
                <Screen.Header.Button style={styles.button} onPress={handleSettingsPress}>
                    <SettingsButton />
                </Screen.Header.Button>
                <Screen.Header.Title>title</Screen.Header.Title>
                <Screen.Header.Button style={styles.button} onPress={handleCurrencyPress}>
                    <CurrencyButton />
                </Screen.Header.Button>
            </Screen.Header>
            <Screen.Scrollable contentContainerStyle={styles.container}>
                <HomeActions />
                <Banner variant="warning" text="Warning" actionText="Action" onPress={() => {}} />
                <List>
                    <List.Group variant="divided">
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
                        <Cell>
                            <Cell.Image type="icon" icon={ArrowDown28} />
                            <Cell.Content>
                                <Cell.Row>
                                    <Cell.Title>Bitcoin</Cell.Title>
                                </Cell.Row>
                            </Cell.Content>
                            <Switch value={isOn} onPress={handlePress} />
                        </Cell>
                        <Cell>
                            <Cell.Image type="icon" icon={ArrowDown28} />
                            <Cell.Content>
                                <Cell.Row>
                                    <Cell.Title>Bitcoin</Cell.Title>
                                </Cell.Row>
                            </Cell.Content>
                            <Cell.Chevron />
                        </Cell>
                    </List.Group>
                </List>
            </Screen.Scrollable>
        </Screen>
    );
};
