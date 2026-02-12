import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    listContentContainer: {
        flex: 1,
        gap: theme.spacing[2],
        marginHorizontal: theme.spacing[8],
        marginBottom: theme.spacing[8]
    },
    portfolioItem: {
        height: 48,
        borderRadius: theme.radius.md,
        overflow: 'hidden'
    },
    rightIconsContainer: {
        flexDirection: 'row',
        gap: theme.spacing[12]
    }
}));
