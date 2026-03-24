import { StyleSheet } from 'react-native-unistyles';

const TICK_HEIGHT_BY_VARIANT = {
    small: 2,
    medium: 4,
    large: 8
} as const;

export const styles = StyleSheet.create(theme => ({
    container: {
        paddingHorizontal: theme.spacing[16],
        paddingTop: theme.spacing[4],
        paddingBottom: theme.spacing[12],
        gap: theme.spacing[12]
    },
    ticksContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        height: 16
    },
    tick: (variant: 'small' | 'medium' | 'large') => ({
        height: TICK_HEIGHT_BY_VARIANT[variant],
        width: 1,
        backgroundColor:
            variant === 'small' ? theme.colors.icon.tertiary : theme.colors.icon.secondary
    }),
    datesWrapper: {
        position: 'relative'
    },
    dates: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    dateContainer: {
        flex: 1
    },
    timeLabelContainer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        justifyContent: 'center'
    }
}));
