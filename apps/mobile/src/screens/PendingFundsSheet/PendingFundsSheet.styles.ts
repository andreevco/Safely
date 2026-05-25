import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    titleBox: {
        alignItems: 'center',
        gap: theme.spacing[4],
        paddingVertical: theme.spacing[16],
        paddingHorizontal: theme.spacing[32]
    },
    table: {
        paddingVertical: theme.spacing[16],
        paddingHorizontal: theme.spacing[24]
    },
    footer: {
        width: '100%',
        padding: theme.spacing[24]
    }
}));
