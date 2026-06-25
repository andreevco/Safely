import { useNavigation } from '@react-navigation/core';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useToast } from '@safely/ux';

import { BottomSheet, Button, Text } from '@mobile/shared/ui';

import { styles } from './MoreOptionsSheet.styles';

export const MoreOptionsSheet = () => {
    const { t } = useTranslation();
    const navigation = useNavigation();
    const toast = useToast();

    const handleConnectLedger = () => {
        toast('TODO: implement Ledger');
    };

    const handleWatchAccount = () => {
        navigation.navigate('OnboardingWatchAccountModal');
    };

    return (
        <BottomSheet shortHeader>
            <View>
                <View style={styles.titleBox}>
                    <Text textAlign="center" variant="titleM">
                        {t('moreOptions.title')}
                    </Text>
                    <Text textAlign="center" variant="bodyL" color="secondary">
                        {t('moreOptions.subtitle')}
                    </Text>
                </View>
                <View style={styles.footer}>
                    <Button type="secondary" size="large" onPress={handleConnectLedger}>
                        {t('moreOptions.connectLedger')}
                    </Button>
                    <Button type="secondary" size="large" onPress={handleWatchAccount}>
                        {t('moreOptions.watchAccount')}
                    </Button>
                </View>
            </View>
        </BottomSheet>
    );
};
