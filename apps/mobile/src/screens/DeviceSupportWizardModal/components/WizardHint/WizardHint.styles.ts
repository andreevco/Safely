import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    banner: {
        alignSelf: 'stretch',
        marginTop: theme.spacing[8],
        alignItems: 'flex-start',
        gap: 0,
        borderWidth: 0,
        variants: {
            hasAction: {
                true: {
                    paddingBottom: theme.spacing[16]
                }
            }
        }
    },
    icon: {
        marginTop: theme.spacing[4]
    },
    text: {
        marginTop: theme.spacing[8],
        gap: theme.spacing[2]
    },
    action: {
        marginTop: theme.spacing[12] - 2
    }
}));
