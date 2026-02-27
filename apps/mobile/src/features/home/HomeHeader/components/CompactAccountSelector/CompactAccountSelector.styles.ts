import Color from 'color';
import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[4],
        paddingVertical: theme.spacing[8],
        paddingLeft: 14,
        paddingRight: theme.spacing[16],
        borderWidth: theme.border.hairline,
        borderColor: theme.colors.other.transparentElement,
        borderRadius: theme.radius.full
    },
    cell: {
        minHeight: 48
    },
    list: {
        shadowColor: new Color(theme.colors.other.constant.black).alpha(0.8).toString(),
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 1,
        shadowRadius: 16,
        elevation: 16
    }
}));
