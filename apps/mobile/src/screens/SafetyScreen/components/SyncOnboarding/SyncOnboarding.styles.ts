import { StyleSheet } from 'react-native-unistyles';

const HEADER_HEIGHT = 64;

export const styles = StyleSheet.create((theme, rt) => ({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1001,
        backgroundColor: theme.colors.background.primary
    },
    header: {
        height: HEADER_HEIGHT + rt.insets.top,
        paddingTop: theme.spacing[12] + rt.insets.top,
        alignItems: 'flex-end',
        paddingHorizontal: theme.spacing[16],
        backgroundColor: theme.colors.background.secondary
    },
    closeButton: {
        zIndex: 10,
        padding: theme.spacing[12],
        borderRadius: theme.radius.full,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.12)'
    },
    pager: {
        flex: 1
    },
    page: {
        flex: 1
    },
    illustration: {
        width: '100%',
        marginTop: -HEADER_HEIGHT,
        aspectRatio: 1,
        backgroundColor: theme.colors.background.secondary
    },
    card: {
        flex: 1,
        marginTop: -theme.spacing[24],
        paddingHorizontal: theme.spacing[32],
        paddingTop: theme.spacing[24],
        gap: theme.spacing[16],
        backgroundColor: theme.colors.background.primary,
        borderTopWidth: theme.border.hairline,
        borderTopColor: theme.colors.other.transparentElement
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing[24],
        paddingTop: theme.spacing[16],
        paddingBottom: theme.spacing[24]
    },
    backButton: {
        padding: theme.spacing[16],
        borderRadius: theme.radius.full,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.background.secondary
    }
}));
