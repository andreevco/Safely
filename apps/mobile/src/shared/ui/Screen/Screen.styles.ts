import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.primary,
        variants: {
            background: {
                transparent: {
                    backgroundColor: 'transparent'
                },
                primary: {
                    backgroundColor: theme.colors.background.primary
                },
                secondary: {
                    backgroundColor: theme.colors.background.secondary
                },
                tertiary: {
                    backgroundColor: theme.colors.background.tertiary
                },
                overlay: {
                    backgroundColor: theme.colors.background.overlay
                }
            }
        }
    }
}));
