import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[16],
        marginVertical: theme.spacing[16],
        marginHorizontal: theme.spacing[24],
        paddingVertical: theme.spacing[12],
        paddingHorizontal: theme.spacing[16],
        borderRadius: theme.radius.md,
        borderWidth: theme.border.hairline,
        borderColor: theme.colors.other.transparentElement,
        backgroundColor: theme.colors.background.secondary
    },
    text: {
        flex: 1
    }
}));
