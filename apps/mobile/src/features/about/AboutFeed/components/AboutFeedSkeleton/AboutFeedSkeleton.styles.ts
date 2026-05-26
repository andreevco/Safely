import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    content: {
        paddingHorizontal: theme.spacing[8],
        gap: theme.spacing[2],
        alignItems: 'flex-start'
    },
    skeletonLabel: {
        marginTop: theme.spacing[16],
        marginBottom: theme.spacing[12],
        marginHorizontal: theme.spacing[8]
    },
    card: {
        gap: theme.spacing[8],
        alignSelf: 'flex-start',
        alignItems: 'flex-start',
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.radius.md,
        paddingHorizontal: theme.spacing[16],
        paddingVertical: theme.spacing[12]
    }
}));
