import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create((theme, rt) => ({
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: theme.spacing[16]
    },
    textContainer: {
        marginVertical: theme.spacing[16],
        marginHorizontal: theme.spacing[32],
        gap: theme.spacing[4],
        alignItems: 'center'
    },
    stepsContainer: {
        width: '100%',
        padding: theme.spacing[16],
        marginVertical: theme.spacing[16],
        marginHorizontal: theme.spacing[32],
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.radius.md,
        gap: theme.spacing[8]
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: theme.spacing[8]
    },
    stepNumber: {
        width: 20,
        height: 20,
        alignItems: 'flex-end'
    },
    stepText: {
        flex: 1
    },
    buttonContainer: {
        gap: theme.spacing[8],
        padding: theme.spacing[24],
        marginBottom: rt.insets.bottom
    }
}));
