import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing[16],
        paddingVertical: theme.spacing[8],
        gap: theme.spacing[8],
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.colors.other.transparentElement,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.button.tertiary.background,
        maxWidth: '80%'
    }
}));
