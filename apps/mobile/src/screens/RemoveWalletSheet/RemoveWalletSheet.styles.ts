import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    titleBox: {
        alignItems: 'center',
        gap: theme.spacing[4],
        paddingVertical: theme.spacing[16],
        paddingHorizontal: theme.spacing[32]
    },
    subtitle: {
        width: '100%'
    },
    footer: {
        width: '100%',
        gap: theme.spacing[8],
        padding: theme.spacing[24],
        paddingBottom: theme.spacing[16]
    }
}));
