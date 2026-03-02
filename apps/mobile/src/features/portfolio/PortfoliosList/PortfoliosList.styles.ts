import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create((theme, rt) => ({
    listContentContainer: {
        flexGrow: 1,
        gap: theme.spacing[2],
        marginHorizontal: theme.spacing[8],
        paddingBottom: rt.insets.bottom + theme.spacing[8]
    },
    portfolioItem: {
        height: 48
    },
    portfolioItemContainer: {
        borderRadius: theme.radius.md,
        overflow: 'hidden'
    },
    rightIconsContainer: {
        flexDirection: 'row',
        gap: theme.spacing[12]
    },
    reorderHandle: {
        padding: 16,
        margin: -16,
        paddingLeft: 8,
        marginLeft: -8
    },
    editingBackdrop: {
        flex: 1
    }
}));
