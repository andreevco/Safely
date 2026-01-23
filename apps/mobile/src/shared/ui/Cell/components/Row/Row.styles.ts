import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: theme.spacing[8]
    }
}));
