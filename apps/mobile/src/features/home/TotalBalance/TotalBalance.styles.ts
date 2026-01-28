import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    container: {
        paddingTop: theme.spacing[64],
        paddingHorizontal: theme.spacing[32],
        paddingBottom: theme.spacing[24],
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing[4]
    }
}));
