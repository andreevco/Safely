import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(() => ({
    corner: {
        position: 'absolute',
        variants: {
            position: {
                topLeft: {
                    top: 0,
                    left: 0
                },
                topRight: {
                    top: 0,
                    right: 0,
                    transform: [{ rotate: '90deg' }]
                },
                bottomLeft: {
                    bottom: 0,
                    left: 0,
                    transform: [{ rotate: '-90deg' }]
                },
                bottomRight: {
                    bottom: 0,
                    right: 0,
                    transform: [{ rotate: '180deg' }]
                }
            }
        }
    }
}));
