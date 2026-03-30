import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    container: {
        flexShrink: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[4],
        paddingVertical: theme.spacing[8],
        paddingLeft: 14,
        paddingRight: theme.spacing[16],
        borderWidth: theme.border.hairline,
        borderColor: theme.colors.other.transparentElement,
        borderRadius: theme.radius.full
    }
}));
