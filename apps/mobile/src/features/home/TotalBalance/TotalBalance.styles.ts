import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    container: {
        padding: theme.spacing[32],
        paddingBottom: theme.spacing[24],
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing[4]
    },
    skeletonContainer: {
        paddingVertical: theme.spacing[12]
    }
}));
