import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.primary,
        justifyContent: 'space-between'
    },
    titleBox: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: theme.spacing[8],
        paddingHorizontal: theme.spacing[32]
    },
    footer: {
        width: '100%',
        gap: theme.spacing[8],
        paddingHorizontal: theme.spacing[24]
    }
}));
