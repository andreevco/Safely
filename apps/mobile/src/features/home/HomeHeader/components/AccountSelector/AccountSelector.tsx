import { AccountName } from '@mobile/entities/account';
import { ChevronDown16, Icon, TouchableOpacity } from '@mobile/shared/ui';

import { styles } from './AccountSelector.styles';

type AccountSelectorProps = {
    onSelectAccountPress: () => void;
};

export const AccountSelector = (props: AccountSelectorProps) => {
    const { onSelectAccountPress } = props;

    return (
        <TouchableOpacity onPress={onSelectAccountPress} style={styles.container}>
            <AccountName name="Wallet" color="rgba(1, 120, 255, 1)" />
            <Icon icon={ChevronDown16} color="tertiary" />
        </TouchableOpacity>
    );
};
