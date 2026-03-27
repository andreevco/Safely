import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useSyncedDevicesMeta } from '@safely/ux';
import { useHasPortfolio } from '@safely/ux';
import { useSecurityCheck } from '@safely/ux/shared/security';

import { RootStackNavigationProp, SettingsStackNavigationProp } from '@mobile/app/navigation/types';
import {
    getBiometryTranslationKey,
    useBiometryQuery,
    useSetBiometryEnabled
} from '@mobile/features/biometry';
import { Badge, Cell, List, Screen, Switch } from '@mobile/shared/ui';
import { ArrowLeft16, Icon } from '@mobile/shared/ui/Icon';

import { WalletSecuritySection } from './components';
import { styles } from './SecurityScreen.styles';

export const SecurityScreen = () => {
    const { t } = useTranslation();
    const { data: biometry } = useBiometryQuery();
    const { mutateAsync: setBiometryEnabled } = useSetBiometryEnabled();
    const check = useSecurityCheck();
    const hasPortfolio = useHasPortfolio();
    const navigation = useNavigation<SettingsStackNavigationProp>();
    const rootNavigation = useNavigation<RootStackNavigationProp>();

    const devicesMeta = useSyncedDevicesMeta();
    const otherDeviceCount = devicesMeta ? Object.keys(devicesMeta).length - 1 : 0;
    const hasLinkedDevices = otherDeviceCount > 0;

    const [lockScreenEnabled, setLockScreenEnabled] = useState(false);

    const handleBiometryToggle = async () => {
        if (biometry) {
            await setBiometryEnabled(!biometry.isEnabled);
        }
    };

    const handleChangePasscode = async () => {
        await check({ title: t('changePasscode.verify.title') });
        rootNavigation.navigate('ChangePasscodeModal');
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
                            {hasLinkedDevices ? (
                                <Cell onPress={() => navigation.navigate('AccountProtectedModal')}>
                                    <Cell.Content>
                                        <View style={styles.badgeRow}>
                                            <Cell.Title>
                                                {t('security.groups.account.protection.title')}
                                            </Cell.Title>
                                            <Badge type="success" isUppercase>
                                                {t('security.groups.account.protection.badge')}
                                            </Badge>
                                        </View>
                                        <Cell.Row>
                                            <Cell.Subtitle numberOfLines={0}>
                                                {t('security.groups.account.protection.subtitle', {
                                                    count: otherDeviceCount
                                                })}
                                            </Cell.Subtitle>
                                        </Cell.Row>
                                    </Cell.Content>
                                    <View style={styles.syncDotGreen} />
                                </Cell>
                            ) : (
                                <Cell onPress={() => navigation.navigate('ProtectAccountModal')}>
                                    <Cell.Content>
                                        <View style={styles.badgeRow}>
                                            <Cell.Title>
                                                {t('security.groups.account.protect.title')}
                                            </Cell.Title>
                                            <Badge type="warning" isUppercase>
                                                {t('security.groups.account.protect.badge')}
                                            </Badge>
                                        </View>
                                        <Cell.Row>
                                            <Cell.Subtitle numberOfLines={0}>
                                                {t('security.groups.account.protect.subtitle')}
                                            </Cell.Subtitle>
                                        </Cell.Row>
                                    </Cell.Content>
                                    <View style={styles.syncDotYellow} />
                                </Cell>
                            )}
                        </List.Group>
                    </List>

                    <List>
                        <List.Title>{t('security.groups.application.title')}</List.Title>
                        <List.Group variant="divided">
                            {biometry && biometry.availableType && (
                                <Cell>
                                    <Cell.Content>
                                        <Cell.Row>
                                            <Cell.Title>
                                                {t(
                                                    `${getBiometryTranslationKey(biometry.availableType)}.title`
                                                )}
                                            </Cell.Title>
                                        </Cell.Row>
                                        <Cell.Row>
                                            <Cell.Subtitle numberOfLines={0}>
                                                {t(
                                                    `${getBiometryTranslationKey(biometry.availableType)}.description`
                                                )}
                                            </Cell.Subtitle>
                                        </Cell.Row>
                                    </Cell.Content>
                                    <Switch
                                        value={biometry.isEnabled}
                                        onPress={handleBiometryToggle}
                                    />
                                </Cell>
                            )}
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

                    {hasPortfolio && <WalletSecuritySection />}
                </View>
            </Screen.Scrollable>
        </Screen>
    );
};
