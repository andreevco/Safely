import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[8]
    },
    editButton: {
        width: 36,
        height: 36
    }
}));
