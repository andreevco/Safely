import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    container: (gap: number) => ({
        flexDirection: 'row',
        alignItems: 'center',
        flexShrink: 1,
        gap
    }),
    dot: (color: string, size: number) => ({
        width: size,
        height: size,
        borderRadius: theme.radius.full,
        backgroundColor: color
    }),
    emojiContainer: (size: number) => ({
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center'
    }),
    emoji: (size: number) => ({
        fontSize: size * 0.75,
        lineHeight: size
    }),
    name: {
        flexShrink: 1
    },
    contentWithTag: {
        flexDirection: 'row',
        alignItems: 'center',
        flexShrink: 1,
        gap: theme.spacing[4]
    }
}));
