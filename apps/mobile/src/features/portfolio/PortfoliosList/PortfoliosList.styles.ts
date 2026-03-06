import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create((theme, rt) => ({
    listContentContainer: {
        flexGrow: 1,
        gap: theme.spacing[2],
        marginHorizontal: theme.spacing[8],
        paddingBottom: rt.insets.bottom + theme.spacing[8]
    },
    portfolioItem: {
        height: 48,
        paddingRight: theme.spacing[8]
    },
    portfolioItemContainer: {
        borderRadius: theme.radius.md,
        overflow: 'hidden'
    },
    portfolioItemContent: {
        height: 48
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
    },
    // At this moment icons with different height and width are not supported and we have to hardcode styles :(
    dotsIcon: {
        height: 14,
        width: 2
    }
}));
