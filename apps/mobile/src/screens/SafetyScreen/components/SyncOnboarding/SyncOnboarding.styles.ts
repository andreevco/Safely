import { StyleSheet } from 'react-native-unistyles';

const HEADER_HEIGHT = 64;
const CARD_BORDER_HEIGHT = 64;

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
    illustrationZone: {
        width: '100%',
        aspectRatio: 1,
        marginTop: -HEADER_HEIGHT,
        backgroundColor: theme.colors.background.secondary,
        overflow: 'hidden'
    },
    illustrationLayer: {
        ...StyleSheet.absoluteFillObject,
        bottom: theme.spacing[24]
    },
    illustrationImage: {
        flex: 1
    },
    card: {
        flex: 1,
        marginTop: -theme.spacing[24],
        borderTopLeftRadius: theme.radius.xl,
        borderTopRightRadius: theme.radius.xl,
        borderCurve: 'continuous',
        overflow: 'hidden',
        backgroundColor: theme.colors.background.primary
    },
    cardBorder: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: CARD_BORDER_HEIGHT
    },
    cardContent: {
        flex: 1,
        marginTop: theme.border.hairline,
        marginHorizontal: theme.border.hairline,
        backgroundColor: theme.colors.background.primary,
        borderTopLeftRadius: theme.radius.xl - theme.border.hairline,
        borderTopRightRadius: theme.radius.xl - theme.border.hairline,
        borderCurve: 'continuous'
    },
    contentLayer: {
        ...StyleSheet.absoluteFillObject,
        paddingHorizontal: theme.spacing[32] - theme.border.hairline,
        paddingTop: theme.spacing[24] - theme.border.hairline,
        gap: theme.spacing[16]
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
