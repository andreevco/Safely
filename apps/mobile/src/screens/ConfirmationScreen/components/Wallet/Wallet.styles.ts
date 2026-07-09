import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    container: {
        alignSelf: 'flex-start',
        alignItems: 'flex-start'
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        flexShrink: 1,
        gap: theme.spacing[4]
    },
    address: {
        flexShrink: 1
    }
}));
