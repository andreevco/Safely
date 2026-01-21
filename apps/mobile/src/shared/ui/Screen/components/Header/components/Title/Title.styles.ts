import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    container: (withHorizontalPadding: boolean) => ({
        flex: 1,
        paddingHorizontal: withHorizontalPadding ? theme.spacing[16] : 0
    })
}));
