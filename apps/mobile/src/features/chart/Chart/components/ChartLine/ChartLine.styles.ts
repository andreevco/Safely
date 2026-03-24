import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    container: {
        paddingHorizontal: theme.spacing[16],
        height: 136
    },
    canvasContainer: {
        flex: 1
    },
    canvas: {
        flex: 1
    },
    priceLabelsContainer: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0
    },
    priceLabel: {
        position: 'absolute',
        right: 0,
        // compensate lineHeight of font
        transform: [{ translateY: -20 }]
    }
}));
