import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    content: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: theme.spacing[16]
    },
    textContainer: {
        gap: 4,
        paddingHorizontal: theme.spacing[32],
        paddingVertical: theme.spacing[16]
    }
}));
