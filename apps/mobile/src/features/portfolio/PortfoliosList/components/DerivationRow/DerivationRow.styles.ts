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
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[12]
    },
    badgeColumn: {
        minWidth: 20,
        alignItems: 'flex-start'
    }
}));
