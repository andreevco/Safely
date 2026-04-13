import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create((theme, rt) => ({
    container: {
        flex: 1,
        justifyContent: 'space-between'
    },
    centerBlock: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: theme.spacing[32],
        gap: theme.spacing[4]
    },
    buttons: {
        padding: theme.spacing[24],
        marginBottom: rt.insets.bottom,
        gap: theme.spacing[8]
    }
}));
