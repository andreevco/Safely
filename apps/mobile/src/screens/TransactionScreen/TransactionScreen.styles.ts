import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    amountContainer: {
        paddingHorizontal: theme.spacing[32],
        paddingVertical: theme.spacing[64],
        alignItems: 'center',
        gap: theme.spacing[4]
    },
    list: {
        gap: theme.spacing[2],
        padding: theme.spacing[8]
    },
    iconsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[16]
    }
}));
