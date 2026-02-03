import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create((theme, rt) => ({
    container: {
        flex: 1
    },
    contentContainer: ({ shouldAddBottomInsets }: { shouldAddBottomInsets: boolean }) => ({
        flexGrow: 1,
        paddingBottom: shouldAddBottomInsets ? rt.insets.bottom + theme.spacing[8] : 0
    })
}));
