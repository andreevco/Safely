import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    content: {
        flex: 1,
        alignItems: 'center',
        paddingTop: theme.spacing[16],
        paddingHorizontal: theme.spacing[32]
    },
    textContainer: {
        marginVertical: theme.spacing[16],
        gap: theme.spacing[4],
        alignItems: 'center'
    },
    stepsContainer: {
        width: '100%',
        paddingVertical: theme.spacing[8],
        paddingHorizontal: theme.spacing[16],
        marginVertical: theme.spacing[16],
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.radius.md
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: theme.spacing[4],
        gap: theme.spacing[8]
    },
    stepNumber: {
        width: 20,
        height: 20,
        alignItems: 'flex-end'
    },
    stepText: {
        flex: 1
    }
}));
