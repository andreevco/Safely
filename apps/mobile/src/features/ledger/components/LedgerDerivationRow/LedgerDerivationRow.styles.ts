import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    container: {
        gap: 0
    },
    badgeColumn: {
        minWidth: 46,
        alignItems: 'flex-start'
    },
    badge: {
        alignSelf: 'flex-start',
        paddingVertical: theme.spacing[4],
        paddingHorizontal: theme.spacing[8],
        backgroundColor: theme.colors.button.tertiary.background,
        borderRadius: theme.radius.xs
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[4]
    }
}));
