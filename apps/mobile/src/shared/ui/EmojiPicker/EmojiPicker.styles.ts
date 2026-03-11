import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(() => ({
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
