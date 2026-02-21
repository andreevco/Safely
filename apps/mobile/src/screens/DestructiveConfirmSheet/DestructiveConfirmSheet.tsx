import { StaticScreenProps, useNavigation } from '@react-navigation/native';
import { useMutation } from '@tanstack/react-query';
import Color from 'color';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useUnistyles } from 'react-native-unistyles';

import { useActivePortfolio, useDeletePortfolio, useSignOutFromAccount } from '@safely/ux';

import { RootStackNavigationProp } from '@mobile/app/navigation/types';
import { BottomSheet, Button, SlideButton, Text, useBottomSheet } from '@mobile/shared/ui';

import { styles } from './DestructiveConfirmSheet.styles';

type DestructiveAction = 'signOut' | 'removePortfolio';

type DestructiveConfirmSheetProps = StaticScreenProps<{
    action: DestructiveAction;
}>;

const useDestructiveAction = (action: DestructiveAction) => {
    const navigation = useNavigation<RootStackNavigationProp>();
    const { close } = useBottomSheet();
    const portfolio = useActivePortfolio();

    const { mutateAsync: deletePortfolio } = useDeletePortfolio();
    const { mutateAsync: signOutAccount } = useSignOutFromAccount();

    return useMutation({
        async mutationFn() {
            if (action === 'signOut') {
                await signOutAccount();
                close();
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'WelcomeScreen' }]
                });
            } else {
                await deletePortfolio(portfolio);
                close();
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'TabsNavigator' }]
                });
            }
        }
    });
};

const DestructiveConfirmContent = (props: { action: DestructiveAction }) => {
    const { action } = props;
    const { t } = useTranslation();
    const { close } = useBottomSheet();
    const { theme } = useUnistyles();

    const confirmKey =
        action === 'signOut'
            ? 'settings.signOutAccount.confirm'
            : 'settings.removePortfolio.confirm';

    const { mutate, isPending } = useDestructiveAction(action);

    return (
        <View style={styles.content}>
            <View style={styles.titleBox}>
                <Text textAlign="center" variant="titleM">
                    {t(`${confirmKey}.title`)}
                </Text>
                <Text textAlign="center" variant="bodyL" color="secondary">
                    {t(`${confirmKey}.message`)}
                </Text>
            </View>

            <View style={styles.footer}>
                <SlideButton
                    label={t(`${confirmKey}.slider.label`)}
                    description={t(`${confirmKey}.slider.description`)}
                    trackColor={Color(theme.colors.accent.red).alpha(0.16).toString()}
                    knobColor={theme.colors.accent.red}
                    textColor={theme.colors.accent.red}
                    loading={isPending}
                    onSlideComplete={() => mutate()}
                />
                <Button type="secondary" size="large" onPress={close}>
                    {t(`${confirmKey}.cancel`)}
                </Button>
            </View>
        </View>
    );
};

export const DestructiveConfirmSheet = (props: DestructiveConfirmSheetProps) => {
    const { action } = props.route.params;

    return (
        <BottomSheet>
            <DestructiveConfirmContent action={action} />
        </BottomSheet>
    );
};
