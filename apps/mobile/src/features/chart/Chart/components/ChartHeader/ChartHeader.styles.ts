import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    container: {
        paddingTop: theme.spacing[12],
        paddingHorizontal: theme.spacing[16],
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[6]
    },
    description: {
        marginTop: 10,
        marginBottom: 2
    }
}));
