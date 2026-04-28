import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create((theme, rt) => ({
    contentContainer: {
        paddingBottom: rt.insets.bottom + theme.spacing[8]
    }
}));
