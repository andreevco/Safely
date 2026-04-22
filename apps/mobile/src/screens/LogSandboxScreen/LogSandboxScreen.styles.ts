import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    content: {
        flexGrow: 1,
        paddingHorizontal: theme.spacing[16],
        gap: theme.spacing[12]
    },
    label: {
        marginTop: theme.spacing[12]
    },
    input: {
        minHeight: 120,
        borderRadius: theme.radius.sm,
        backgroundColor: theme.colors.background.secondary,
        color: theme.colors.text.primary,
        padding: theme.spacing[12]
    },
    levelRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing[8]
    },
    levelButton: {
        flexGrow: 1,
        flexBasis: '30%'
    },
    presetsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing[8]
    },
    presetButton: {
        flexGrow: 1,
        flexBasis: '45%'
    },
    actionsGroup: {
        marginTop: 'auto'
    }
}));
