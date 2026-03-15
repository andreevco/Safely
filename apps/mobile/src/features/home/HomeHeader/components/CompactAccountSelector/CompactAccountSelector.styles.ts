import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    root: {
        flex: 1
    },
    touchableContainer: {
        flexShrink: 1,
        paddingVertical: theme.spacing[8],
        paddingLeft: 14,
        paddingRight: theme.spacing[16],
        borderWidth: theme.border.hairline,
        borderColor: theme.colors.other.transparentElement,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.background.primary
    },
    innerTouchableContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[4],
        flexShrink: 1
    },
    addButton: {
        zIndex: 10000,
        alignSelf: 'center'
    },
    listContainer: {
        borderRadius: theme.radius.md,
        overflow: 'hidden'
    }
}));
