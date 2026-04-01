import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    container: {
        flex: 1,
        justifyContent: 'space-between'
    },
    centerBlock: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: theme.spacing[16]
    },
    titleBox: {
        alignItems: 'center',
        gap: theme.spacing[4],
        paddingVertical: theme.spacing[16],
        paddingHorizontal: theme.spacing[32]
    },
    banner: {
        margin: theme.spacing[24]
    },
    logo: {
        width: 96,
        height: 96
    },
    feedbackRow: {
        flexDirection: 'row',
        alignItems: 'center'
    }
}));
