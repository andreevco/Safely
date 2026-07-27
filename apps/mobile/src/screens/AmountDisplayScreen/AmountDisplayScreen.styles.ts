import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create((theme, rt) => ({
    listContent: {
        flexGrow: 1,
        paddingBottom: theme.spacing[8] + rt.insets.bottom
    }
}));
