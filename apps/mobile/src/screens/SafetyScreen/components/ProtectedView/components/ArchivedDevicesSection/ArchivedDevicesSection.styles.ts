import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    toggle: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: theme.spacing[4],
        paddingVertical: theme.spacing[12],
        paddingHorizontal: theme.spacing[16]
    },
    container: {
        width: '100%',
        padding: theme.spacing[8]
    },
    rows: {
        gap: theme.spacing[2]
    },
    footnote: {
        paddingHorizontal: theme.spacing[8],
        paddingTop: theme.spacing[8]
    }
}));
