import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(() => ({
    container: {
        flex: 1
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999
    }
}));
