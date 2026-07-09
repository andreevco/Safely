import { StyleSheet } from 'react-native-unistyles';

const SPINNER_SIZE = 56;

export const styles = StyleSheet.create(() => ({
    wrapper: (size: number = SPINNER_SIZE) => ({
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center'
    })
}));
