import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    content: {
        paddingHorizontal: theme.spacing[32],
        paddingVertical: theme.spacing[16]
    },
    footer: {
        width: '100%',
        gap: theme.spacing[8],
        padding: theme.spacing[24],
        paddingBottom: theme.spacing[16]
    }
}));
