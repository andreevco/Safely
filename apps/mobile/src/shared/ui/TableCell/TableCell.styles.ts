import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[8],
        paddingHorizontal: theme.spacing[16],
        paddingVertical: theme.spacing[12],
        backgroundColor: theme.colors.background.secondary
    }
}));
