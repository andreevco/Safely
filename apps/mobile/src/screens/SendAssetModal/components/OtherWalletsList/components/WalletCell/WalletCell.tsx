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

    // TODO: I really don't know how I should better handle cases when btc wallets > 1 ¯\_(ツ)_/¯.
    // Kinda complex logic, need to be discussed.
    const address = derivations[0]?.chains.btc.wallets[0]?.address;

    return derivations.map((derivation, idx, arr) => (
        <Fragment key={derivation.id.toString()}>
            <Cell
                showDivider={idx === arr.length - 1 ? showDivider : true}
                onPress={() => onSelect(address, portfolio.meta.name)}
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
