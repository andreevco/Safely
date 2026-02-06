import { usePasscode } from '@mobile/entities/security';
import { PasscodeSetup } from '@mobile/shared/ui';
import { useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export const ChangePasscodeScreen = () => {
    const { t } = useTranslation();
    const navigation = useNavigation();
    const passcode = usePasscode();

    const handleComplete = useCallback(
        async (newPasscode: string) => {
            if (passcode.isSet) {
                await passcode.set(newPasscode);
            }
            navigation.goBack();
        },
        [passcode, navigation]
    );

    return (
        <PasscodeSetup
            headerType="close"
            title={t('changePasscode.new.title')}
            reenterTitle={t('changePasscode.reenter.title')}
            onComplete={handleComplete}
        />
    );
};
