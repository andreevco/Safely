import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    container: {
        flex: 1,
        justifyContent: 'space-between'
    },
    centerBlock: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: theme.spacing[16]
    },
    titleBox: {
        alignItems: 'center',
        gap: theme.spacing[4],
        paddingVertical: theme.spacing[16],
        paddingHorizontal: theme.spacing[32]
    },
    infoBox: {
        borderRadius: theme.radius.md,
        borderWidth: theme.border.hairline,
        borderColor: theme.colors.other.transparentElement,
        backgroundColor: theme.colors.background.tertiary,
        padding: theme.spacing[16],
        gap: theme.spacing[12],
        margin: theme.spacing[24]
    },
    feedbackRow: {
        flexDirection: 'row',
        alignItems: 'center'
    }
}));
