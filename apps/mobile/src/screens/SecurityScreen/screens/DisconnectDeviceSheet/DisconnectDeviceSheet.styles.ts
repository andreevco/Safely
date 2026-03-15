import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create((theme, rt) => ({
    content: {
        alignItems: 'center'
    },
    titleBox: {
        alignItems: 'center',
        gap: theme.spacing[4],
        marginVertical: theme.spacing[16],
        paddingHorizontal: theme.spacing[32]
    },
    footer: {
        width: '100%',
        gap: theme.spacing[8],
        padding: theme.spacing[24],
        marginBottom: rt.insets.bottom
    }
}));
