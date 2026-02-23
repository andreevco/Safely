import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    container: {
        paddingHorizontal: theme.spacing[16],
        paddingVertical: theme.spacing[12],
        backgroundColor: theme.colors.background.secondary
    },
    contentContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: theme.spacing[8]
    },
    titleContainer: {
        width: 120
    },
    valueContainer: {
        alignItems: 'flex-start',
        alignSelf: 'flex-start',
        justifyContent: 'center',
        flex: 1
    }
}));
