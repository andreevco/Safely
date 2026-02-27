import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[4],
        paddingVertical: theme.spacing[8],
        paddingLeft: 14,
        paddingRight: theme.spacing[16],
        borderWidth: theme.border.hairline,
        borderColor: theme.colors.other.transparentElement,
        borderRadius: theme.radius.full
    },
    cell: {
        minHeight: 48
    },
    list: {
        shadowColor: '#0C0C0D',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 1,
        shadowRadius: 24,
        elevation: 24
    }
}));
