import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create((theme, rt) => ({
    container: {},
    listContent: {
        flexGrow: 1,
        paddingHorizontal: theme.spacing[8],
        paddingBottom: theme.spacing[8] + rt.insets.bottom
    },
    preview: {
        backgroundColor: theme.colors.background.secondary,
        padding: theme.spacing[32]
    },
    footer: {
        paddingTop: 0,
        paddingBottom: theme.spacing[12]
    },
    checkmarkSlot: {
        width: 28,
        height: 28
    },
    previewCard: {
        borderRadius: theme.radius.md,
        overflow: 'hidden'
    }
}));
