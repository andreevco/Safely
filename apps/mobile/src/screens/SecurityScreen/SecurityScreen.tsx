import { RootStackNavigationProp, SettingsStackNavigationProp } from '@mobile/app/navigation/types';
import { PortfolioName } from '@mobile/entities/portfolio';
import { useSecurityCheck } from '@mobile/entities/security';
import { Cell, List, Screen, Switch } from '@mobile/shared/ui';
import { ArrowLeft16, Icon, Switch16 } from '@mobile/shared/ui/Icon';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useActivePortfolio } from '@safely/ux';

import { styles } from './SecurityScreen.styles';

export const SecurityScreen = () => {
    const { t } = useTranslation();
    const navigation = useNavigation<SettingsStackNavigationProp>();
    const rootNavigation = useNavigation<RootStackNavigationProp>();
    const portfolio = useActivePortfolio();
    const { check } = useSecurityCheck();

    // TODO: Real logic
    const [faceIdEnabled, setFaceIdEnabled] = useState(false);
    const [lockScreenEnabled, setLockScreenEnabled] = useState(false);

    const handleSelectWallet = () => {
        rootNavigation.navigate('SelectAccountModal');
    };

    const handleChangePasscode = async () => {
        const passed = await check({ title: t('changePasscode.verify.title') });
        if (!passed) return;

        rootNavigation.navigate('ChangePasscodeModal');
    };

    const handleRecoveryPress = () => {
        rootNavigation.navigate('RecoveryConfirmSheet');
    };

    return (
        <Screen>
            <Screen.Header variant="center">
                <Screen.Header.Button onPress={navigation.goBack}>
                    <Icon icon={ArrowLeft16} />
                </Screen.Header.Button>
                <Screen.Header.Title>{t('security.title')}</Screen.Header.Title>
                <View style={styles.headerPlaceholder} />
            </Screen.Header>
            <Screen.Scrollable contentContainerStyle={styles.listContent}>
                <View style={styles.container}>
                    <List>
                        <List.Title>{t('security.groups.account.title')}</List.Title>
                        <List.Group>
                            <Cell>
                                <Cell.Content>
                                    <Cell.Row>
                                        <Cell.Title>
                                            {t('security.groups.account.protect.title')}
                                        </Cell.Title>
                                    </Cell.Row>
                                    <Cell.Row>
                                        <Cell.Subtitle numberOfLines={0}>
                                            {t('security.groups.account.protect.subtitle')}
                                        </Cell.Subtitle>
                                    </Cell.Row>
                                </Cell.Content>
                                <Cell.Chevron />
                            </Cell>
                        </List.Group>
                    </List>

                    <List>
                        <List.Title>{t('security.groups.application.title')}</List.Title>
                        <List.Group variant="divided">
                            <Cell>
                                <Cell.Content>
                                    <Cell.Row>
                                        <Cell.Title>
                                            {t('security.groups.application.faceId.title')}
                                        </Cell.Title>
                                    </Cell.Row>
                                    <Cell.Row>
                                        <Cell.Subtitle numberOfLines={0}>
                                            {t('security.groups.application.faceId.subtitle')}
                                        </Cell.Subtitle>
                                    </Cell.Row>
                                </Cell.Content>
                                <Switch
                                    value={faceIdEnabled}
                                    onPress={() => setFaceIdEnabled(!faceIdEnabled)}
                                />
                            </Cell>
                            <Cell>
                                <Cell.Content>
                                    <Cell.Row>
                                        <Cell.Title>
                                            {t('security.groups.application.lockScreen.title')}
                                        </Cell.Title>
                                    </Cell.Row>
                                    <Cell.Row>
                                        <Cell.Subtitle numberOfLines={0}>
                                            {t('security.groups.application.lockScreen.subtitle')}
                                        </Cell.Subtitle>
                                    </Cell.Row>
                                </Cell.Content>
                                <Switch
                                    value={lockScreenEnabled}
                                    onPress={() => setLockScreenEnabled(!lockScreenEnabled)}
                                />
                            </Cell>
                            <Cell onPress={handleChangePasscode}>
                                <Cell.Content>
                                    <Cell.Row>
                                        <Cell.Title>
                                            {t('security.groups.application.changePasscode')}
                                        </Cell.Title>
                                    </Cell.Row>
                                </Cell.Content>
                                <Cell.Chevron />
                            </Cell>
                        </List.Group>
                    </List>

                    <List>
                        <List.Title>{t('security.groups.wallet.title')}</List.Title>
                        <List.Group style={styles.listGroupMargin}>
                            <Cell onPress={handleSelectWallet}>
                                <Cell.Content>
                                    <Cell.Row>
                                        <PortfolioName meta={portfolio.meta} />
                                    </Cell.Row>
                                </Cell.Content>
                                <Icon icon={Switch16} color="tertiary" />
                            </Cell>
                        </List.Group>
                        <List.Group>
                            <Cell onPress={handleRecoveryPress}>
                                <Cell.Content>
                                    <Cell.Row>
                                        <Cell.Title>
                                            {t('security.groups.wallet.recovery.title')}
                                        </Cell.Title>
                                    </Cell.Row>
                                    <Cell.Row>
                                        <Cell.Subtitle numberOfLines={0}>
                                            {t('security.groups.wallet.recovery.subtitle')}
                                        </Cell.Subtitle>
                                    </Cell.Row>
                                </Cell.Content>
                                <Cell.Chevron />
                            </Cell>
                        </List.Group>
                    </List>
                </View>
            </Screen.Scrollable>
        </Screen>
    );
};
