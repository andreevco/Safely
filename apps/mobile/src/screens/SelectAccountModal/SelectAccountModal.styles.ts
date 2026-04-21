import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create((theme, rt) => ({
    addButton: {
        alignSelf: 'center',
        marginTop: theme.spacing[8] - 2
    },
    contentContainer: {
        flexGrow: 1,
        gap: theme.spacing[2],
        marginHorizontal: theme.spacing[8],
        paddingBottom: rt.insets.bottom + theme.spacing[8]
    }
}));
