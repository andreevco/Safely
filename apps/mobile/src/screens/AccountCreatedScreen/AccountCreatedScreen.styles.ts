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
    stepsContainerWrapper: {
        width: '100%'
    },
    stepsContainer: {
        paddingHorizontal: theme.spacing[16],
        paddingVertical: theme.spacing[8],
        marginVertical: theme.spacing[16],
        marginHorizontal: theme.spacing[16],
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.radius.md,
        borderWidth: theme.border.hairline,
        borderColor: theme.colors.other.transparentElement
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: theme.spacing[8],
        paddingVertical: theme.spacing[4]
    },
    stepNumber: {
        width: 14,
        height: 20,
        alignItems: 'flex-end'
    },
    stepText: {
        flex: 1
    },
    buttonContainer: {
        gap: theme.spacing[8],
        padding: theme.spacing[24],
        paddingBottom: theme.spacing[16]
    }
}));
