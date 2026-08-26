import type { FC } from 'react';

import type { Contact } from '@safely/core';
import Human16 from '@safely/ux/assets/icons/16/human-16.svg?react';

import { toContactColorStyle } from './contact-color';
import { iconStyles } from './ContactCell.styles';
import { Cell, Icon } from '../../shared';

export type ContactCellProps = {
    contact: Contact;
    onSelect: () => void;
};

export const ContactCell: FC<ContactCellProps> = ({ contact, onSelect }) => (
    <Cell onClick={onSelect}>
        <Cell.Leading>
            <Icon
                asset={Human16}
                tone="inherit"
                className={iconStyles}
                style={toContactColorStyle(contact.meta.color)}
            />
        </Cell.Leading>
        <Cell.Content>
            <Cell.Title>{contact.meta.name}</Cell.Title>
        </Cell.Content>
    </Cell>
);
