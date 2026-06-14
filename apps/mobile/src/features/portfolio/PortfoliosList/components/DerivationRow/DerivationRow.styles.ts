import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    cell: {
        marginLeft: theme.spacing[24] + 4
    },
    row: {
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingRight: theme.spacing[6]
    },
    address: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[12]
    },
    badgeColumn: {
        width: 32,
        alignItems: 'flex-start'
    }
}));
