import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    container: {
        gap: theme.spacing[24],
        paddingHorizontal: theme.spacing[24]
    },
    header: {
        alignItems: 'center',
        gap: theme.spacing[16]
    },
    image: {
        width: 390,
        height: 195
    },
    updateIcon: {
        width: 96,
        height: 96
    },
    textContainer: {
        gap: theme.spacing[4],
        paddingHorizontal: theme.spacing[8]
    },
    buttons: {
        flexDirection: 'row',
        marginVertical: theme.spacing[24],
        gap: theme.spacing[12]
    },
    buttonItem: {
        flex: 1
    }
}));
