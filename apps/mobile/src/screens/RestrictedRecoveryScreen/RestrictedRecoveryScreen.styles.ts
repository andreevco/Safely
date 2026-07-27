import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    content: {
        paddingHorizontal: theme.spacing[8],
        gap: theme.spacing[8]
    },
    icon: {
        marginTop: theme.spacing[16],
        marginHorizontal: 'auto'
    },
    recoveryText: {
        gap: theme.spacing[4],
        paddingVertical: theme.spacing[16],
        paddingHorizontal: theme.spacing[32]
    },
    listWithoutTitle: {
        marginTop: theme.spacing[16]
    },
    nonRecoverableName: {
        flexDirection: 'row',
        alignItems: 'center',
        flexShrink: 1,
        gap: theme.spacing[4]
    }
}));
