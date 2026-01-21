import { StyleSheet } from 'react-native-unistyles';

const HEADER_HEIGHT = 64;

export const styles = StyleSheet.create((theme, rt) => ({
    container: ({ shouldInsetTop }: { shouldInsetTop: boolean }) => ({
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: shouldInsetTop ? rt.insets.top + HEADER_HEIGHT : HEADER_HEIGHT,
        paddingTop: shouldInsetTop ? rt.insets.top : 0,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        zIndex: 1000,
        backgroundColor: theme.colors.background.primary,
        variants: {
            background: {
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
                },
                transparent: {
                    backgroundColor: 'transparent'
                }
            }
        }
    }),
    compensateHeaderHeight: ({ shouldInsetTop }: { shouldInsetTop: boolean }) => ({
        height: shouldInsetTop ? rt.insets.top + HEADER_HEIGHT : HEADER_HEIGHT
    })
}));
