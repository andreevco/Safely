import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    content: {
        alignItems: 'center',
        paddingBottom: theme.spacing[16]
    },
    textBox: {
        paddingVertical: theme.spacing[16],
        paddingHorizontal: theme.spacing[32],
        gap: theme.spacing[4],
        alignItems: 'center'
    },
    action: {
        marginTop: theme.spacing[32] + theme.spacing[8]
    }
}));
