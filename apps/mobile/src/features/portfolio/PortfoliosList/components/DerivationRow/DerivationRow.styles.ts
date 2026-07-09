import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    cell: {
        marginLeft: theme.spacing[24] + 4
    },
    row: {
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    address: {
        flexShrink: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[12]
    },
    title: {
        flexShrink: 1
    },
    badgeColumn: {
        minWidth: 20,
        alignItems: 'flex-start'
    }
}));
