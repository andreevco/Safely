import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create((theme, rt) => ({
    container: ({ hasSides, shouldInsetTop }: { hasSides: boolean; shouldInsetTop: boolean }) => ({
        flex: 1,
        variants: {
            variant: {
                center: {
                    flex: undefined,
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    justifyContent: 'center',
                    top: shouldInsetTop ? rt.insets.top : 0,
                    bottom: 0,
                    width: '100%',
                    alignItems: 'center',
                    paddingHorizontal: hasSides ? 64 : 0,
                    zIndex: -1
                },
                left: {
                    paddingHorizontal: theme.spacing[16]
                }
            }
        }
    })
}));
