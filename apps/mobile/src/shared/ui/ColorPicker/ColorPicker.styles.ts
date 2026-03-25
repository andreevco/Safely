import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    container: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center'
    },
    colorButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center'
    },
    colorCircle: {
        width: 32,
        height: 32,
        borderRadius: theme.radius.full,
        alignItems: 'center',
        justifyContent: 'center'
    },
    selectedIndicator: {
        width: 28,
        height: 28,
        borderRadius: theme.radius.full,
        borderWidth: 4,
        borderColor: theme.colors.background.primary
    }
}));
