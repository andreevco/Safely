import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    spinnerBackground: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.background.secondary
    }
}));
