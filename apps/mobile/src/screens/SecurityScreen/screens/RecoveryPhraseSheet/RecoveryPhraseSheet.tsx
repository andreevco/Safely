import { Button, Screen, Text, WordCell } from '@mobile/shared/ui';
import { ExclamationmarkCircle16, Icon } from '@mobile/shared/ui/Icon';
import { useCopy } from '@mobile/shared/utils/copy';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { styles } from './RecoveryPhraseSheet.styles';

// TODO: Replace with actual phrase from wallet
const MOCK_PHRASE = [
    'abandon',
    'ability',
    'able',
    'about',
    'above',
    'absent',
    'absorb',
    'abstract',
    'absurd',
    'abuse',
    'access',
    'accident'
];

const RecoveryPhraseContent = () => {
    const { t } = useTranslation();
    const copy = useCopy();

    const halfLength = Math.ceil(MOCK_PHRASE.length / 2);
    const leftColumn = MOCK_PHRASE.slice(0, halfLength);
    const rightColumn = MOCK_PHRASE.slice(halfLength);

    const handleCopy = () => {
        copy(MOCK_PHRASE.join(' '));
    };

    return (
        <View style={styles.content}>
            <View style={styles.banner}>
                <Text variant="bodyM" style={styles.bannerText}>
                    {t('security.phraseSheet.warning')}
                </Text>
                <Icon icon={ExclamationmarkCircle16} style={styles.bannerIcon} />
            </View>

            <View style={styles.wordsContainer}>
                <View style={styles.column}>
                    {leftColumn.map((word, i) => (
                        <WordCell
                            key={i}
                            index={i + 1}
                            word={word}
                            params={{
                                isLast: i === leftColumn.length - 1,
                                isRightColumn: false
                            }}
                        />
                    ))}
                </View>
                <View style={styles.column}>
                    {rightColumn.map((word, i) => (
                        <WordCell
                            key={i}
                            index={halfLength + i + 1}
                            word={word}
                            params={{
                                isLast: i === rightColumn.length - 1,
                                isRightColumn: true
                            }}
                        />
                    ))}
                </View>
            </View>

            <Button type="secondary" size="small" style={styles.copyButton} onPress={handleCopy}>
                {t('security.phraseSheet.copy')}
            </Button>
        </View>
    );
};

export const RecoveryPhraseSheet = () => {
    const { t } = useTranslation();

    return (
        <Screen>
            <Screen.Header variant="left">
                <Screen.Header.Title>{t('security.phraseSheet.title')}</Screen.Header.Title>
                <Screen.Header.CloseButton />
            </Screen.Header>
            <Screen.Content>
                <RecoveryPhraseContent />
            </Screen.Content>
        </Screen>
    );
};
