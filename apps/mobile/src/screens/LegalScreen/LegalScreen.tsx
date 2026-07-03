import { useNavigation } from '@react-navigation/core';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useBootConfig, useLinking } from '@safely/ux';

import { Cell, List, Screen } from '@mobile/shared/ui';
import { ArrowLeft16, Icon } from '@mobile/shared/ui/Icon';

import { styles } from './LegalScreen.styles';

export const LegalScreen = () => {
    const { t } = useTranslation();
    const { openURL } = useLinking();
    const navigation = useNavigation();
    const privacyUrl = useBootConfig().references.legal.privacy_url;

    return (
        <Screen>
            <Screen.Header variant="center">
                <Screen.Header.Button onPress={navigation.goBack}>
                    <Icon icon={ArrowLeft16} />
                </Screen.Header.Button>
                <Screen.Header.Title>{t('legal.title')}</Screen.Header.Title>
                <View style={styles.headerPlaceholder} />
            </Screen.Header>
            <Screen.Scrollable contentContainerStyle={styles.listContent}>
                <List style={styles.container}>
                    <List.Group variant="divided">
                        <Cell onPress={() => openURL(privacyUrl)}>
                            <Cell.Content>
                                <Cell.Row>
                                    <Cell.Title>{t('legal.privacyPolicy')}</Cell.Title>
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
