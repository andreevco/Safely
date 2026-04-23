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
    subtitle: {
        flex: 1
    },
    subvalue: {
        flexShrink: 0
    }
}));
