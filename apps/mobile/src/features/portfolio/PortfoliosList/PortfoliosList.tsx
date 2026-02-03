import { PortfolioName } from '@mobile/entities/portfolio/PortfolioName/PortfolioName';
import { Cell } from '@mobile/shared/ui';
import { List } from '@mobile/shared/ui';

import { Portfolio } from '@safely/core';
import { useActivePortfolio } from '@safely/ux';

import { styles } from './PortfoliosList.styles';

interface PortfoliosListProps {
    portfolios: Portfolio[];
}

export const PortfoliosList = (props: PortfoliosListProps) => {
    const { portfolios } = props;
    const activePortfolio = useActivePortfolio();

    return (
        <List>
            <List.Group style={styles.list} variant="separated">
                {portfolios.map(portfolio => (
                    <Cell key={portfolio.id.toString()}>
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
