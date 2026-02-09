import { PortfolioName } from '@mobile/entities/portfolio/PortfolioName/PortfolioName';
import { Cell, List } from '@mobile/shared/ui';

import { Portfolio } from '@safely/core';
import { useActivePortfolio, useSetActivePortfolio } from '@safely/ux';

import { styles } from './PortfoliosList.styles';

interface PortfoliosListProps {
    portfolios: Portfolio[];
    onSelect: () => void;
}

export const PortfoliosList = (props: PortfoliosListProps) => {
    const { portfolios, onSelect } = props;
    const activePortfolio = useActivePortfolio();
    const { mutate: setActivePortfolio } = useSetActivePortfolio();

    const handleSelect = (portfolio: Portfolio) => {
        if (portfolio.id.toString() === activePortfolio.id.toString()) {
            onSelect();
            return;
        }
        setActivePortfolio({ id: portfolio.id }, { onSuccess: onSelect });
    };

    return (
        <List>
            <List.Group style={styles.list} variant="separated">
                {portfolios.map(portfolio => (
                    <Cell key={portfolio.id.toString()} onPress={() => handleSelect(portfolio)}>
                        <Cell.Content>
                            <Cell.Row>
                                <PortfolioName meta={portfolio.meta} gap={12} size={16} />
                            </Cell.Row>
                        </Cell.Content>
                        {activePortfolio.id.toString() === portfolio.id.toString() && (
                            <Cell.Checkmark />
                        )}
                    </Cell>
                ))}
            </List.Group>
        </List>
    );
};
