import { Fragment } from 'react';

import { ellipsisMiddle, Portfolio } from '@safely/core';

import { PortfolioName } from '@mobile/entities/portfolio';
import { Cell, Text } from '@mobile/shared/ui';

import { styles } from './WalletCell.styles';

interface WalletCellProps {
    portfolio: Portfolio;
    showDivider?: boolean;
    onSelect: (address: string) => void;
}

export const WalletCell = (props: WalletCellProps) => {
    const { portfolio, showDivider, onSelect } = props;

    const derivations = portfolio.getDerivations();

    // TODO: I really don't know how I should better handle cases when derivations > 1, btc wallets > 1, etc. ¯\_(ツ)_/¯.
    // Kinda complex logic, need to discuss
    const address = derivations[0]?.chains.btc.wallets[0]?.address;

    return derivations.map((derivation, idx, arr) => (
        <Fragment key={derivation.id.toString()}>
            <Cell
                showDivider={idx === arr.length - 1 ? showDivider : true}
                onPress={() => onSelect(address)}
            >
                <Cell.Content>
                    <Cell.Row style={styles.row}>
                        <PortfolioName
                            fontVariant="labelL"
                            meta={portfolio.meta}
                            gap={12}
                            size={16}
                        />
                        {arr.length > 1 && (
                            <Text variant="bodyL" color="tertiary">
                                {ellipsisMiddle(address, 4)}
                            </Text>
                        )}
                    </Cell.Row>
                </Cell.Content>
            </Cell>
        </Fragment>
    ));
};
