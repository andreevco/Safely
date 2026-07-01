import { useNavigation } from '@react-navigation/core';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useToast } from '@safely/ux';

import { BottomSheet, Button, Text, useCallOnClose } from '@mobile/shared/ui';

import { styles } from './MoreOptionsSheet.styles';

const MoreOptionsContent = () => {
    const { t } = useTranslation();
    const navigation = useNavigation();
    const toast = useToast();
    const callOnClose = useCallOnClose();

    const handleConnectLedger = () => {
        toast('TODO: implement Ledger');
    };

    const handleWatchAccount = () => {
        callOnClose(() => navigation.navigate('OnboardingWatchAccountScreen'));
    };

    return (
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
    );
};

export const MoreOptionsSheet = () => {
    return (
        <BottomSheet shortHeader>
            <MoreOptionsContent />
        </BottomSheet>
    );
};
