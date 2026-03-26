import { useNavigation } from '@react-navigation/native';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useActivePortfolio, useRecordActivePortfolioSecretReveal } from '@safely/ux';

import { RootStackNavigationProp } from '@mobile/app/navigation/types';
import { BottomSheet, Button, Text, useBottomSheet } from '@mobile/shared/ui';
import { Icon, ListKey96 } from '@mobile/shared/ui/Icon';

import { styles } from './RecoveryConfirmSheet.styles';

const RecoveryConfirmContent = () => {
    const { t } = useTranslation();
    const { close } = useBottomSheet();
    const portfolio = useActivePortfolio();
    const navigation = useNavigation<RootStackNavigationProp>();

    const { mutateAsync: recordSeedReveal } = useRecordActivePortfolioSecretReveal();
    const hasRevealed = useRef(false);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            if (hasRevealed.current) {
                close();
            }
        });

        return unsubscribe;
    }, [navigation, close]);

    const handleReveal = async () => {
        try {
            const mnemonic = await portfolio.getMnemonic();
            await recordSeedReveal();
            hasRevealed.current = true;
            navigation.navigate('RecoveryPhraseModal', { mnemonic });
        } catch {
            // Security check failed
        }
    };

    return (
        <View style={styles.content}>
            <Icon icon={ListKey96} />

            <View style={styles.titleBox}>
                <Text textAlign="center" variant="titleL">
                    {t('security.recoverySheet.title')}
                </Text>
                <Text textAlign="center" variant="bodyL" color="secondary">
                    {t('security.recoverySheet.description')}
                </Text>
            </View>

            <View style={styles.warningBox}>
                <View style={styles.bulletRow}>
                    <View style={styles.bulletDot} />
                    <Text variant="bodyM" color="secondary" style={styles.bulletText}>
                        {t('security.recoverySheet.warning1')}
                    </Text>
                </View>
                <View style={styles.bulletRow}>
                    <View style={styles.bulletDot} />
                    <Text variant="bodyM" color="secondary" style={styles.bulletText}>
                        {t('security.recoverySheet.warning2')}
                    </Text>
                </View>
            </View>

            <View style={styles.buttons}>
                <Button type="secondary" size="large" style={styles.button} onPress={close}>
                    {t('security.recoverySheet.cancel')}
                </Button>
                <Button
                    type="primary"
                    size="large"
                    style={[styles.button, styles.buttonPrimary]}
                    onPress={handleReveal}
                >
                    {t('security.recoverySheet.reveal')}
                </Button>
            </View>
        </View>
    );
};

export const RecoveryConfirmSheet = () => {
    return (
        <BottomSheet>
            <RecoveryConfirmContent />
        </BottomSheet>
    );
};
