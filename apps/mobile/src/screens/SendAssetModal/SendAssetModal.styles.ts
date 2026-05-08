import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    pagerView: {
        flex: 1
    },
    nextButton: {
        margin: theme.spacing[12]
    },
    recipientRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center'
    },
    recipientName: {
        flexShrink: 1
    },
    page: {
        flex: 1
    }
}));
