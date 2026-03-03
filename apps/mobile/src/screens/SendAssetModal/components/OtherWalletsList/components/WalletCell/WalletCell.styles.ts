import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: theme.spacing[8]
    }
}));
