import { StyleSheet } from 'react-native-unistyles';

import { AccountLinkState } from '@safely/ux';

export const styles = StyleSheet.create(theme => ({
    dot: (state: AccountLinkState) => ({
        width: 10,
        height: 10,
        borderRadius: theme.radius.full,
        backgroundColor:
            state === AccountLinkState.UNLINKED
                ? theme.colors.accent.red
                : state === AccountLinkState.PROTECTED
                  ? theme.colors.accent.green
                  : theme.colors.accent.orange
    })
}));
