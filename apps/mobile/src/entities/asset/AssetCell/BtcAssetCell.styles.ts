import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(() => ({
    cell: {
        alignItems: 'flex-start'
    },
    image: {
        marginTop: 6
    },
    titleRow: {
        alignItems: 'center',
        minHeight: 24
    },
    subtitleRow: {
        alignItems: 'flex-start'
    },
    subvalue: {
        flexShrink: 0
    },
    subtitleContainer: {
        flex: 1,
        flexDirection: 'row'
    },
    chevron: {
        marginTop: 5
    }
}));
