import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    badge: {
        backgroundColor: theme.colors.accent.red,
        borderRadius: theme.radius.full,
        minWidth: 8,
        minHeight: 8,
        maxWidth: 8,
        maxHeight: 8
    }
}));
