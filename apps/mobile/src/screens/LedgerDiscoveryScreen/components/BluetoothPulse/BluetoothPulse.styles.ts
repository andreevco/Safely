import { StyleSheet } from 'react-native-unistyles';

const PULSE_SIZE = 96;

export const styles = StyleSheet.create(theme => ({
    container: {
        alignItems: 'center',
        justifyContent: 'center'
    },
    pulse: {
        position: 'absolute',
        width: PULSE_SIZE,
        height: PULSE_SIZE,
        borderRadius: PULSE_SIZE / 2,
        backgroundColor: theme.colors.accent.blue
    }
}));
