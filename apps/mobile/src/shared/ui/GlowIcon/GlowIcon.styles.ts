import { StyleSheet } from 'react-native-unistyles';

export const GLOW_SIZE = 32;

const GLOW_OFFSET = 5;

export const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center'
    },
    glow: {
        position: 'absolute',
        transform: [{ translateY: -GLOW_OFFSET }]
    }
});
