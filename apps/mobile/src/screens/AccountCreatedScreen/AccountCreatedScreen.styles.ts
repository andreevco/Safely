import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create((theme, rt) => ({
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: theme.spacing[16],
        paddingTop: rt.insets.top + theme.spacing[16]
    },
    textContainer: {
        marginVertical: theme.spacing[16],
        marginHorizontal: theme.spacing[32],
        gap: theme.spacing[4],
        alignItems: 'center'
    },
    stepsWrapper: {
        width: '100%',
        marginHorizontal: theme.spacing[16]
    },
    buttonContainer: {
        gap: theme.spacing[8],
        padding: theme.spacing[24],
        paddingBottom: theme.spacing[16]
    }
}));
