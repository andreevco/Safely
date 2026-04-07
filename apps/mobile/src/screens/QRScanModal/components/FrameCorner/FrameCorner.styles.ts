import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(() => ({
    corner: {
        position: 'absolute',
        variants: {
            position: {
                topLeft: {
                    top: -1,
                    left: -1
                },
                topRight: {
                    top: -1,
                    right: -1,
                    transform: [{ rotate: '90deg' }]
                },
                bottomLeft: {
                    bottom: -1,
                    left: -1,
                    transform: [{ rotate: '-90deg' }]
                },
                bottomRight: {
                    bottom: -1,
                    right: -1,
                    transform: [{ rotate: '180deg' }]
                }
            }
        }
    }
}));
