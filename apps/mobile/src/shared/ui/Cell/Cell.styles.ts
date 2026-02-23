import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[16],
        paddingHorizontal: theme.spacing[16],
        paddingVertical: 10,
        backgroundColor: theme.colors.background.secondary
    }
}));
