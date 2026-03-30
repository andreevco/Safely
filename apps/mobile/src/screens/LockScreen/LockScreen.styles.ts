import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(() => ({
    signOutButton: (isVisible: boolean) => ({
        opacity: isVisible ? 1 : 0
    })
}));
