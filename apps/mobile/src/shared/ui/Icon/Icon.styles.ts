import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    icon: (size: number) => ({
        width: size,
        height: size,
        variants: {
            color: {
                primary: {
                    tintColor: theme.colors.icon.primary
                },
                tertiary: {
                    tintColor: theme.colors.icon.tertiary
                },
                color: {
                    tintColor: theme.colors.icon.color
                }
            }
        }
    })
}));
