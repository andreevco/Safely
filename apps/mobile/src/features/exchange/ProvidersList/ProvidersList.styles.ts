import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    list: {
        marginHorizontal: theme.spacing[8],
        borderRadius: theme.radius.md,
        overflow: 'hidden',
        gap: theme.spacing[2]
    }
}));
