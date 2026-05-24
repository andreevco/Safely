import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    list: {
        gap: theme.spacing[2],
        marginTop: theme.spacing[4]
    },
    listRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: theme.spacing[8]
    },
    listText: {
        flexShrink: 1
    }
}));
