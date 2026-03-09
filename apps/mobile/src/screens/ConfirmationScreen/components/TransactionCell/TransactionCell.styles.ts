import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    wrapper: {
        paddingVertical: theme.spacing[12],
        paddingHorizontal: theme.spacing[16],
        backgroundColor: theme.colors.background.secondary
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: theme.spacing[8]
    },
    label: {
        width: 120
    },
    value: {
        flex: 1,
        alignItems: 'flex-start',
        justifyContent: 'center'
    }
}));
