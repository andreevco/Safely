import { Fragment } from 'react';

import { Portfolio } from '@safely/core';

import { PortfolioName } from '@mobile/entities/portfolio';
import { Cell } from '@mobile/shared/ui';

interface WalletCellProps {
    portfolio: Portfolio;
    showDivider?: boolean;
    onSelect: (address: string, label: string) => void;
}

export const WalletCell = (props: WalletCellProps) => {
    const { portfolio, showDivider, onSelect } = props;

    const derivations = portfolio.getDerivations();

    return derivations.map((derivation, idx, arr) => (
        <Fragment key={derivation.id.toString()}>
            <Cell
                showDivider={idx === arr.length - 1 ? showDivider : true}
                onPress={() =>
                    onSelect(derivation.chains.btc.wallets[0]?.address, portfolio.meta.name)
                }
            >
                <Cell.Content>
                    <Cell.Row>
                        <PortfolioName
                            fontVariant="labelL"
                            meta={portfolio.meta}
                            gap={12}
                            size={16}
                            tag={arr.length > 1 && idx + 1}
                        />
                    </Cell.Row>
                </Cell.Content>
            </Cell>
        </Fragment>
    ));
};
