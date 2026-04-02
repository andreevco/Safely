import { Cell, Icon, List, Switch16 } from '@mobile/shared/ui';

import { AccountCell } from './AccountCell';

interface ModalAccountSelectorProps {
    name: string;
    walletsCount: number;
    onPress: () => void;
}

export const ModalAccountSelector = (props: ModalAccountSelectorProps) => {
    const { name, walletsCount, onPress } = props;

    return (
        <List.Group withoutBottomMargin>
            <Cell onPress={onPress}>
                <AccountCell name={name} walletsCount={walletsCount} />
                <Icon icon={Switch16} color="tertiary" />
            </Cell>
        </List.Group>
    );
};
