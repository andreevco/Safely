import { useCallback } from 'react';

import { ContactMeta } from '@safely/core';

import { Cell, Icon, Human16 } from '@mobile/shared/ui';
import { CellContainerProps } from '@mobile/shared/ui/Cell/Cell';

type ContactCellProps = CellContainerProps & {
    meta: ContactMeta;
    isSelected?: boolean;
    onPress?: () => void;
};

export const ContactCell = (props: ContactCellProps) => {
    const { meta, isSelected, onPress, ...rest } = props;

    const handlePress = useCallback(() => {
        onPress?.();
    }, [onPress]);

    return (
        <Cell disabled={!onPress} onPress={handlePress} {...rest}>
            <Icon icon={Human16} style={{ tintColor: meta.color }} />
            <Cell.Content>
                <Cell.Row>
                    <Cell.Title variant="labelL">{meta.name}</Cell.Title>
                </Cell.Row>
            </Cell.Content>
            {isSelected && <Cell.Checkmark />}
        </Cell>
    );
};
