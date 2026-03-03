import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    scrollContainer: {
        flex: 1,
        marginTop: theme.spacing[12]
    },
    scrollContent: {
        paddingHorizontal: theme.spacing[4],
        paddingBottom: theme.spacing[16]
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    emojiButton: {
        width: 38,
        height: 38,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent'
    },
    emoji: {
        fontSize: 30
    }
}));
