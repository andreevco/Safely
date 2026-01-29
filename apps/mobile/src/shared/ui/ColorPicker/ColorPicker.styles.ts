import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: theme.spacing[16],
        paddingBottom: theme.spacing[8],
        paddingHorizontal: theme.spacing[8]
    },
    colorCircle: {
        width: 32,
        height: 32,
        borderRadius: theme.radius.full,
        alignItems: 'center',
        justifyContent: 'center'
    },
    selectedIndicator: {
        width: 28,
        height: 28,
        borderRadius: theme.radius.full,
        borderWidth: 4,
        borderColor: theme.colors.background.primary
    }
}));
