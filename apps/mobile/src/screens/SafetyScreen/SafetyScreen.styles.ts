import { StyleSheet } from 'react-native-unistyles';

import { AccountLinkState } from '@safely/ux';

export const styles = StyleSheet.create(theme => ({
    buttonContainer: {
        padding: theme.spacing[24],
        paddingBottom: theme.spacing[16]
    },
    headerButton: {
        marginHorizontal: theme.spacing[12]
    },
    badge: (state: AccountLinkState) => ({
        backgroundColor:
            state === AccountLinkState.UNLINKED
                ? theme.colors.accent.red
                : theme.colors.accent.orange,
        borderRadius: theme.radius.full,
        minWidth: 8,
        minHeight: 8,
        maxWidth: 8,
        maxHeight: 8
    })
}));
