import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    textContainer: {
        paddingVertical: theme.spacing[16],
        paddingHorizontal: theme.spacing[32],
        gap: theme.spacing[4],
        alignItems: 'center',
        justifyContent: 'center'
    }
}));
