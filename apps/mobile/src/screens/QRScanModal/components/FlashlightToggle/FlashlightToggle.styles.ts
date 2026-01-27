import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create((theme, rt) => ({
    container: {
        padding: theme.spacing[24],
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        bottom: rt.insets.bottom,
        left: 0,
        right: 0
    },
    button: {
        padding: 14,
        borderRadius: theme.radius.full,
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        variants: {
            active: {
                true: {
                    backgroundColor: theme.colors.other.constant.white
                }
            }
        }
    }
}));
