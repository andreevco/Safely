import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing[16],
        paddingVertical: theme.spacing[8],
        gap: theme.spacing[8],
        borderRadius: theme.radius.full,
        maxWidth: '80%',
        variants: {
            variant: {
                default: {
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: theme.colors.other.transparentElement,
                    backgroundColor: theme.colors.button.tertiary.background
                },
                white: {
                    backgroundColor: theme.colors.other.constant.white,
                    shadowColor: theme.colors.other.constant.black,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.24,
                    shadowRadius: 16,
                    elevation: 8
                }
            }
        }
    }
}));
