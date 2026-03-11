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
    timeLabelContainer: {
        position: 'absolute',
        top: -24,
        alignItems: 'center'
    },
    timeLabelText: {
        color: theme.colors.text.primary
    }
}));
