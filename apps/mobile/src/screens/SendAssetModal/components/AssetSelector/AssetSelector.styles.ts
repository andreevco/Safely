import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    image: {
        width: 32,
        height: 32,
        borderRadius: theme.radius.full
    },
    label: {
        marginBottom: -2
    },
    imageWithText: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[12],
        margin: theme.spacing[12]
    }
}));
