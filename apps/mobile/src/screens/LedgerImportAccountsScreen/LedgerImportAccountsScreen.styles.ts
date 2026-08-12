import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create((theme, rt) => ({
    content: {
        flex: 1
    },
    textContainer: {
        marginVertical: theme.spacing[16],
        paddingHorizontal: theme.spacing[32],
        gap: theme.spacing[4],
        alignItems: 'center'
    },
    list: {
        paddingHorizontal: theme.spacing[16]
    },
    caption: {
        marginTop: theme.spacing[8],
        paddingHorizontal: theme.spacing[32]
    },
    showNext: {
        alignSelf: 'center',
        marginTop: theme.spacing[8]
    },
    continueButton: {
        padding: theme.spacing[24],
        marginBottom: rt.insets.bottom
    }
}));
