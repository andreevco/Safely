import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    contentContainer: {
        paddingHorizontal: theme.spacing[8]
    },
    firstSectionHeader: {
        marginTop: theme.spacing[4]
    },
    separator: {
        height: 2
    },
    sectionHeaderContainer: {
        paddingHorizontal: theme.spacing[8],
        // compensate item separator height
        paddingTop: 22,
        paddingBottom: 10
    },
    firstSectionHeaderContainer: {
        paddingTop: theme.spacing[16]
    }
}));
