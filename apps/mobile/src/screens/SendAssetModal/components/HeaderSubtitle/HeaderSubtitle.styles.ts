import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    row: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: theme.spacing[4]
    },
    shrinkable: {
        flexShrink: 1,
        maxWidth: '40%'
    }
}));
