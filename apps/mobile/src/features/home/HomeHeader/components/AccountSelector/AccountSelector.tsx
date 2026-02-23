import { useActivePortfolio } from '@safely/ux';

import { PortfolioName } from '@mobile/entities/portfolio';
import { ChevronDown16, Icon, TouchableOpacity } from '@mobile/shared/ui';

import { styles } from './AccountSelector.styles';

type AccountSelectorProps = {
    onSelectAccountPress: () => void;
};

export const AccountSelector = (props: AccountSelectorProps) => {
    const { onSelectAccountPress } = props;
    const portfolio = useActivePortfolio();

    return (
        <TouchableOpacity onPress={onSelectAccountPress} style={styles.container}>
            <PortfolioName meta={portfolio.meta} />
            <Icon icon={ChevronDown16} color="tertiary" />
        </TouchableOpacity>
    );
};
