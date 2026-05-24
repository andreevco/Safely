import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    content: {
        paddingHorizontal: theme.spacing[8],
        paddingBottom: theme.spacing[16]
    },
    sectionTitle: {
        paddingTop: theme.spacing[16],
        paddingBottom: theme.spacing[12],
        paddingHorizontal: theme.spacing[8]
    },
    card: {
        alignSelf: 'flex-start',
        alignItems: 'flex-start',
        maxWidth: '85%',
        marginBottom: theme.spacing[2],
        gap: theme.spacing[4],
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.radius.md,
        paddingHorizontal: theme.spacing[16],
        paddingVertical: theme.spacing[12]
    }
}));
