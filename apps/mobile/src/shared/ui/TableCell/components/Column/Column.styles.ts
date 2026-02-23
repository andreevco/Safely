import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(() => ({
    container: {
        flexDirection: 'column',
        flex: 1,
        variants: {
            leading: {
                true: {
                    width: 120,
                    flex: undefined
                }
            }
        }
    }
}));
