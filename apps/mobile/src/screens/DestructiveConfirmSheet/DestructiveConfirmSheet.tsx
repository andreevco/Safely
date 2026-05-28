import type { StaticScreenProps } from '@react-navigation/native';
import Color from 'color';
import { View } from 'react-native';
import { useUnistyles } from 'react-native-unistyles';

import { useMutation } from '@safely/ux';

import { BottomSheet, Button, SlideButton, Text, useBottomSheet } from '@mobile/shared/ui';

import { styles } from './DestructiveConfirmSheet.styles';

type DestructiveConfirmSheetProps = StaticScreenProps<{
    title: string;
    message: string;
    sliderLabel: string;
    sliderDescription: string;
    cancelLabel: string;
    onConfirm: () => void | Promise<void>;
}>;

const DestructiveConfirmContent = (props: DestructiveConfirmSheetProps['route']['params']) => {
    const { title, message, sliderLabel, sliderDescription, cancelLabel, onConfirm } = props;

    const { close } = useBottomSheet();
    const { theme } = useUnistyles();

    const { mutate, isPending } = useMutation({
        mutationFn: async () => {
            await onConfirm();
        }
    });

    return (
        <View style={styles.content}>
            <View style={styles.titleBox}>
                <Text textAlign="center" variant="titleM">
                    {title}
                </Text>
                <Text textAlign="center" variant="bodyL" color="secondary">
                    {message}
                </Text>
            </View>

            <View style={styles.footer}>
                <SlideButton
                    label={sliderLabel}
                    description={sliderDescription}
                    trackColor={Color(theme.colors.accent.red).alpha(0.16).toString()}
                    knobColor={theme.colors.accent.red}
                    textColor={theme.colors.accent.red}
                    loading={isPending}
                    onSlideComplete={() => mutate()}
                />
                <Button type="secondary" size="large" onPress={close}>
                    {cancelLabel}
                </Button>
            </View>
        </View>
    );
};

export const DestructiveConfirmSheet = (props: DestructiveConfirmSheetProps) => {
    return (
        <BottomSheet>
            <DestructiveConfirmContent {...props.route.params} />
        </BottomSheet>
    );
};
