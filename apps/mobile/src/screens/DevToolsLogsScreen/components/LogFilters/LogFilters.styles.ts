import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    filters: {
        gap: theme.spacing[8]
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing[8]
    }
}));
