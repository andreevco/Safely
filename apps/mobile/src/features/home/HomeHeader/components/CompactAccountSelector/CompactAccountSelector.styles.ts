import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create((theme, rt) => ({
    root: {
        flexShrink: 1
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
        overflow: 'hidden',
        backgroundColor: theme.colors.background.secondary
    },
    footer: {
        gap: theme.spacing[4]
    },
    settingsHint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[4],
        justifyContent: 'center'
    },
    settingsHeader: {
        position: 'absolute',
        top: rt.insets.top + 2,
        left: 0,
        zIndex: 1000
    },
    settingsTouchable: {
        paddingVertical: 18,
        paddingHorizontal: theme.spacing[16]
    },
    settingsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing[4],
        paddingHorizontal: 5.5,
        borderRadius: 5,
        borderWidth: 0.75,
        borderColor: theme.colors.other.transparentElement,
        backgroundColor: theme.colors.background.primary
    }
}));
