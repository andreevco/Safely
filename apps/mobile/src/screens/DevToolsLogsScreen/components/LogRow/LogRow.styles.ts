import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    row: {
        gap: theme.spacing[2],
        paddingVertical: theme.spacing[6],
        paddingHorizontal: theme.spacing[12],
        borderRadius: theme.radius.sm,
        backgroundColor: theme.colors.background.secondary
    },
    rowMeta: {
        flexDirection: 'row',
        gap: theme.spacing[8],
        alignItems: 'center'
    },
    scope: {
        flexShrink: 1
    },
    toggle: {
        marginLeft: 'auto'
    }
}));
