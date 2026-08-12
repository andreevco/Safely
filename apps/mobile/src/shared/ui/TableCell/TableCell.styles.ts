import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    container: {
        flexDirection: 'row',
        backgroundColor: theme.colors.background.secondary,
        gap: theme.spacing[8],
        paddingHorizontal: theme.spacing[16],
        paddingVertical: theme.spacing[12],
        variants: {
            rowDivider: {
                true: {
                    borderBottomWidth: theme.border.hairline,
                    borderBottomColor: theme.colors.other.transparentElement
                }
            }
        }
    },
    divider: {
        borderBottomWidth: theme.border.hairline,
        borderBottomColor: theme.colors.other.transparentElement
    },
    columnDivider: {
        alignSelf: 'stretch',
        width: theme.border.hairline,
        marginVertical: -theme.spacing[12],
        backgroundColor: theme.colors.other.transparentElement
    },
    copiedIndicator: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        paddingRight: theme.spacing[16],
        paddingLeft: theme.spacing[24],
        justifyContent: 'center'
    },
    copiedIndicatorGradient: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        width: 16
    },
    copiedAbsoluteContainer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0
    },
    copiedIndicatorBackground: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 16,
        right: 0,
        backgroundColor: theme.colors.background.secondary
    }
}));
