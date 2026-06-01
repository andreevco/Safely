import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create((theme, rt) => ({
    cell: ({ isLast, isFirst }: { isLast: boolean; isFirst: boolean }) => ({
        borderTopLeftRadius: isFirst ? theme.radius.md : 0,
        borderTopRightRadius: isFirst ? theme.radius.md : 0,
        borderBottomLeftRadius: isLast ? theme.radius.md : 0,
        borderBottomRightRadius: isLast ? theme.radius.md : 0
    }),
    contentContainer: {
        flexGrow: 1,
        paddingBottom: rt.insets.bottom + theme.spacing[8],
        paddingHorizontal: theme.spacing[8]
    }
}));
