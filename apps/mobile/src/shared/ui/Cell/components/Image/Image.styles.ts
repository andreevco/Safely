import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    content: {
        height: 32,
        width: 32,
        variants: {
            variant: {
                square: {
                    borderRadius: theme.radius.sm
                },
                rounded: {
                    borderRadius: theme.radius.full
                }
            }
        }
    }
}));
