import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    wrapper: {
        position: 'absolute',
        bottom: theme.spacing[12],
        left: 0,
        right: 0,
        zIndex: 1000,
        alignItems: 'center'
    }
}));
