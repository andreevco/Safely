import Color from 'color';
import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    cell: {
        backgroundColor: Color(theme.colors.accent.red).alpha(0.16).toString()
    },
    text: {
        color: theme.colors.accent.red
    }
}));
