import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create((theme, rt) => ({
    container: {
        paddingHorizontal: theme.spacing[8]
    },
    listContent: {
        flexGrow: 1,
        paddingBottom: theme.spacing[8] + rt.insets.bottom
    },
    cellContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[8]
    },
    checkmarkSlot: {
        width: 28,
        height: 28
    },
    cellSymbol: {
        minWidth: 44
    },
    headerPlaceholder: {
        width: 40,
        padding: theme.spacing[12]
    }
}));
