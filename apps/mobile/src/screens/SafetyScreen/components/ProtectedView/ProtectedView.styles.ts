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
    deviceList: {
        width: '100%',
        gap: theme.spacing[2],
        padding: theme.spacing[8]
    },
    deviceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: theme.spacing[12] - 2,
        paddingHorizontal: theme.spacing[16],
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.radius.md
    },
    deviceInfo: {
        flex: 1,
        gap: theme.spacing[2]
    },
    deviceNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[8]
    }
}));
