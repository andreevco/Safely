import { StyleSheet } from 'react-native-unistyles';

export const TRACK_PADDING = 2;
export const THUMB_WIDTH = 24;

export const styles = StyleSheet.create(theme => ({
    container: {
        variants: {
            disabled: {
                true: {
                    opacity: 0.56
                }
            }
        }
    },
    track: {
        alignItems: 'flex-start',
        justifyContent: 'center',
        width: 48,
        height: 24,
        padding: TRACK_PADDING,
        borderRadius: theme.radius.xs
    },
    thumb: {
        width: THUMB_WIDTH,
        height: 20,
        borderRadius: theme.radius.xss,
        backgroundColor: theme.colors.other.constant.white,
        shadowColor: theme.colors.other.constant.black,
        shadowOpacity: 0.15,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 3
    }
}));
