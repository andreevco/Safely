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
    const { privacy_url, terms_url } = useBootConfig().references.legal;

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
                        <Cell onPress={() => openURL(terms_url)}>
                            <Cell.Content>
                                <Cell.Row>
                                    <Cell.Title>{t('legal.termsOfUse')}</Cell.Title>
                                </Cell.Row>
                            </Cell.Content>
                            <Cell.Chevron />
                        </Cell>
                        <Cell onPress={() => openURL(privacy_url)}>
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
