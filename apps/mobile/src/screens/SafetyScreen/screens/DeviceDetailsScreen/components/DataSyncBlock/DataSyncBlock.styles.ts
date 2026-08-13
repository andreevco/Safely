import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    statusColumn: {
        gap: theme.spacing[4]
    },
    walletsColumn: {
        gap: theme.spacing[4]
    },
    fullAccessBanner: {
        marginTop: theme.spacing[2],
        marginBottom: theme.spacing[8],
        borderWidth: 0
    }
}));
