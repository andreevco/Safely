import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    icon: {
        marginHorizontal: 'auto',
        marginTop: theme.spacing[16]
    },
    textContainer: {
        gap: 4,
        paddingHorizontal: theme.spacing[32],
        paddingVertical: theme.spacing[16]
    }
}));
