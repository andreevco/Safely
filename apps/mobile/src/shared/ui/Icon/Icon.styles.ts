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
                secondary: {
                    tintColor: theme.colors.icon.secondary
                },
                tertiary: {
                    tintColor: theme.colors.icon.tertiary
                },
                constantBlack: {
                    tintColor: theme.colors.other.constant.black
                },
                constantWhite: {
                    tintColor: theme.colors.other.constant.white
                }
            }
        }
    })
}));
