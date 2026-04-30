import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    content: {
        flexGrow: 1,
        padding: theme.spacing[24],
        paddingTop: 0,
        gap: theme.spacing[12]
    },
    label: {
        marginTop: theme.spacing[24]
    },
    inputContainer: {
        minHeight: 120,
        alignItems: 'flex-start'
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
