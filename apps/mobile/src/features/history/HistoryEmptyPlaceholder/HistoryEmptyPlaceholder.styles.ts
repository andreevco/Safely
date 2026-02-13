import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing[16],
        paddingHorizontal: theme.spacing[32]
    },
    emptySubtitle: {
        marginTop: theme.spacing[4]
    },
    emptyActions: {
        flexDirection: 'row',
        gap: theme.spacing[8],
        marginTop: theme.spacing[16]
    }
}));
