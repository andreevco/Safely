import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    content: {
        flex: 1,
        alignItems: 'center',
        paddingTop: theme.spacing[16]
    },
    textContainer: {
        marginVertical: theme.spacing[16],
        paddingHorizontal: theme.spacing[32],
        gap: theme.spacing[4],
        alignItems: 'center'
    },
    attentionBanner: {
        marginBottom: theme.spacing[2],
        borderWidth: 0
    },
    buttonsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: theme.spacing[8],
        marginBottom: theme.spacing[16]
    },
    deviceList: {
        width: '100%',
        padding: theme.spacing[8]
    },
    deviceRows: {
        gap: theme.spacing[2]
    }
}));
