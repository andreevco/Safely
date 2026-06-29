import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: -theme.spacing[4],
        paddingBottom: theme.spacing[12],
        paddingLeft: 15
    }
}));
