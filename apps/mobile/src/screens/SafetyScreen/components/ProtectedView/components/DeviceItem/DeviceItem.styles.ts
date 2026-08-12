import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: theme.spacing[12] - 2,
        paddingHorizontal: theme.spacing[16],
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.radius.md
    },
    info: {
        flex: 1,
        gap: theme.spacing[2]
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[8]
    }
}));
