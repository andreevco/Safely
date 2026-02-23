import Color from 'color';
import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    container: {
        paddingHorizontal: theme.spacing[8],
        gap: theme.spacing[16]
    },
    headerPlaceholder: {
        width: 40,
        padding: theme.spacing[12]
    },
    groupTitle: {
        marginTop: theme.spacing[16],
        marginBottom: theme.spacing[8]
    },
    signOutGroup: {},
    signOutCell: {
        backgroundColor: Color(theme.colors.accent.red).alpha(0.16).toString()
    },
    signOutText: {
        color: theme.colors.accent.red
    }
}));
