import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    hero: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing[16]
    },
    heroText: {
        alignItems: 'center',
        gap: theme.spacing[4],
        paddingHorizontal: theme.spacing[32]
    },
    footer: {
        margin: theme.spacing[24],
        gap: theme.spacing[16]
    }
}));
