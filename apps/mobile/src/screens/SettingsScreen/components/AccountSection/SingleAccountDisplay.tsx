import { Cell, List } from '@mobile/shared/ui';

import { AccountCell } from './AccountCell';

interface SingleAccountDisplayProps {
    name: string;
    walletsCount: number;
}

export const SingleAccountDisplay = (props: SingleAccountDisplayProps) => {
    const { name, walletsCount } = props;

    return (
        <List.Group withoutBottomMargin>
            <Cell>
                <AccountCell name={name} walletsCount={walletsCount} />
            </Cell>
        </List.Group>
    );
};
