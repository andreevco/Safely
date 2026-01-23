import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing[16],
        paddingVertical: 10,
        backgroundColor: theme.colors.background.secondary
    }
}));
