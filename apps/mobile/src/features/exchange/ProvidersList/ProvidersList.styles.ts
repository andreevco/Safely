import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create((theme, rt) => ({
    contentContainer: {
        flexGrow: 1,
        paddingBottom: rt.insets.bottom
    },
    list: {
        marginHorizontal: theme.spacing[8]
    },
    footer: {
        marginTop: 'auto',
        padding: theme.spacing[24],
        paddingTop: theme.spacing[8]
    }
}));
