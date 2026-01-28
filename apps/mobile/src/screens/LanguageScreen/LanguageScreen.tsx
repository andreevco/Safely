import { SettingsStackNavigationProp } from '@mobile/app/navigation/types';
import { Cell, List, Screen, Text } from '@mobile/shared/ui';
import { Checkmark28, ChevronRight16, Icon } from '@mobile/shared/ui/Icon';
import { TouchableOpacity } from '@mobile/shared/ui/TouchableOpacity';
import { useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { styles } from './LanguageScreen.styles';

interface Language {
    code: string;
    nativeName: string;
}

const languages: Language[] = [
    { code: 'en', nativeName: 'English' },
    { code: 'ru', nativeName: 'Русский' }
];

export const LanguageScreen = () => {
    const { t, i18n } = useTranslation();
    const navigation = useNavigation<SettingsStackNavigationProp>();

    const handlePress = useCallback(
        (code: string) => () => {
            if (i18n.language !== code) {
                i18n.changeLanguage(code);
            }

            navigation.goBack();
        },
        [i18n, navigation]
    );

    return (
        <Screen>
            <Screen.Header variant="center">
                <Screen.Header.Button onPress={navigation.goBack}>
                    <Icon icon={ChevronRight16} style={styles.backIcon} />
                </Screen.Header.Button>
                <Screen.Header.Title>{t('language.title')}</Screen.Header.Title>
                <View style={styles.headerPlaceholder} />
            </Screen.Header>
            <Screen.Scrollable contentContainerStyle={styles.listContent}>
                <List style={styles.container}>
                    <List.Group variant="divided">
                        {languages.map(language => {
                            const isSelected = i18n.language === language.code;

                            return (
                                <TouchableOpacity
                                    key={language.code}
                                    onPress={handlePress(language.code)}
                                >
                                    <Cell>
                                        <Cell.Content style={styles.cellContent}>
                                            <Cell.Row>
                                                <Cell.Title>
                                                    {t(`language.languages.${language.code}`)}
                                                </Cell.Title>
                                            </Cell.Row>
                                            <Text
                                                variant="bodyM"
                                                color="secondary"
                                                style={styles.nativeName}
                                            >
                                                {language.nativeName}
                                            </Text>
                                        </Cell.Content>
                                        {isSelected && <Icon icon={Checkmark28} color="accent" />}
                                    </Cell>
                                </TouchableOpacity>
                            );
                        })}
                    </List.Group>
                </List>
            </Screen.Scrollable>
        </Screen>
    );
};
