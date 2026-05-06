import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[32],
        variants: {
            alignItems: {
                start: {
                    alignItems: 'flex-start'
                },
                center: {
                    alignItems: 'center'
                }
            }
        }
    }
}));
