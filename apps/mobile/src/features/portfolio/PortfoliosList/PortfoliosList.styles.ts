import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    portfolioItem: {
        height: 48,
        paddingRight: theme.spacing[8]
    },
    portfolioItemContainer: {
        borderRadius: theme.radius.md,
        overflow: 'hidden',
        variants: {
            variant: {
                compact: {
                    borderRadius: 0
                }
            }
        }
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
