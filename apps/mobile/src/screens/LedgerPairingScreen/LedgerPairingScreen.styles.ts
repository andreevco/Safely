import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    content: {
        flex: 1,
        alignItems: 'center',
        paddingTop: theme.spacing[16],
        paddingHorizontal: theme.spacing[32]
    },
    image: {
        width: 390,
        height: 195
    },
    textContainer: {
        paddingVertical: theme.spacing[16],
        gap: theme.spacing[4],
        alignItems: 'center'
    }
}));
