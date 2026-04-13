import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    dot: (synced: boolean) => ({
        width: 10,
        height: 10,
        borderRadius: theme.radius.full,
        backgroundColor: synced ? theme.colors.accent.green : theme.colors.accent.orange
    })
}));
