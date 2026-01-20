import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    sheetBg: {
        backgroundColor: theme.colors.other.constant.black,
        borderRadius: theme.radius.xl
    },
    overlay: {
        flex: 1
    }
}));
