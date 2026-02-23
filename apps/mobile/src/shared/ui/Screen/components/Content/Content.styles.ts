import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create((theme, rt) => ({
    container: ({ shouldAddBottomInsets }: { shouldAddBottomInsets: boolean }) => ({
        flex: 1,
        paddingBottom: shouldAddBottomInsets ? rt.insets.bottom + theme.spacing[8] : 0
    })
}));
