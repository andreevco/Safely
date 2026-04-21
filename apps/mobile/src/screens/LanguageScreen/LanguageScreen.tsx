import { useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { SettingsStackNavigationProp } from '@mobile/app/navigation/types';
import { availableLanguages, LanguageCode } from '@mobile/shared/i18n';
import { mobileStorages } from '@mobile/shared/storage';
import { Cell, List, Screen, Text } from '@mobile/shared/ui';
import { ArrowLeft16, Checkmark28, Icon } from '@mobile/shared/ui/Icon';

import { styles } from './LanguageScreen.styles';

export const LanguageScreen = () => {
    const { t, i18n } = useTranslation();
    const navigation = useNavigation<SettingsStackNavigationProp>();
    const handlePress = useCallback(
        (code: LanguageCode) => () => {
            if (i18n.language === code) return;

            void i18n.changeLanguage(code).then(() => mobileStorages.locale.storage.set(code));
        },
        [i18n]
    );

    return (
        <Screen>
            <Screen.Header variant="center">
                <Screen.Header.Button onPress={navigation.goBack}>
                    <Icon icon={ArrowLeft16} />
                </Screen.Header.Button>
                <Screen.Header.Title>{t('language.title')}</Screen.Header.Title>
                <View style={styles.headerPlaceholder} />
            </Screen.Header>
            <Screen.Scrollable contentContainerStyle={styles.listContent}>
                <List style={styles.container}>
                    <List.Group variant="divided">
                        {availableLanguages.map(language => {
                            const isSelected = i18n.language === language.code;

                            return (
                                <Cell key={language.code} onPress={handlePress(language.code)}>
                                    <Cell.Content style={styles.cellContent}>
                                        <Cell.Row>
                                            <Cell.Title>
                                                {t(`language.languages.${language.code}`)}
                                            </Cell.Title>
                                        </Cell.Row>
                                        <Text variant="bodyM" color="secondary">
                                            {language.nativeName}
                                        </Text>
                                    </Cell.Content>
                                    {isSelected && <Icon icon={Checkmark28} color="accent" />}
                                </Cell>
                            );
                        })}
                    </List.Group>
                </List>
            </Screen.Scrollable>
        </Screen>
    );
};
