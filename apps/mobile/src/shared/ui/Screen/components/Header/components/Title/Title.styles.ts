import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    container: (shouldAddHorizontalPadding: boolean) => ({
        flex: 1,
        variants: {
            variant: {
                center: {
                    flex: undefined,
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    width: '100%',
                    alignItems: 'center',
                    paddingHorizontal: shouldAddHorizontalPadding ? 64 : 0,
                    zIndex: -1
                },
                left: {
                    paddingHorizontal: theme.spacing[16]
                }
            }
        }
    })
}));
