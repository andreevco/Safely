import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    sheetBg: {
        backgroundColor: theme.colors.other.constant.black,
        borderTopLeftRadius: theme.radius.xl,
        borderTopRightRadius: theme.radius.xl
    },
    overlay: {
        flex: 1
    }
}));
