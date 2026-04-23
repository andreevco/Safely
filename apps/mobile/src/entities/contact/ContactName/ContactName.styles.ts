import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(() => ({
    container: (gap: number) => ({
        flexDirection: 'row',
        alignItems: 'center',
        flexShrink: 1,
        gap
    }),
    name: {
        flexShrink: 1
    }
}));
