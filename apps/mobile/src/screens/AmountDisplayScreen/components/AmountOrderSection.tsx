import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import type { AmountUnit } from '@safely/ux';

import { Cell, List, Text } from '@mobile/shared/ui';
import { Checkmark28, Icon } from '@mobile/shared/ui/Icon';

import { styles } from '../AmountDisplayScreen.styles';
import { PreviewCard } from './PreviewCard';

const AMOUNT_DISPLAY_ORDERS: AmountUnit[] = ['crypto', 'fiat'];

type AmountOrderSectionProps = {
    title: string;
    footer: ReactNode;
    order: AmountUnit;
    onSelect: (order: AmountUnit) => void;
    children: ReactNode;
};

export const AmountOrderSection = (props: AmountOrderSectionProps) => {
    const { title, footer, order, onSelect, children } = props;

    const { t } = useTranslation();

    return (
        <List>
            <List.Title>{title}</List.Title>
            <List.Group variant="divided">
                {AMOUNT_DISPLAY_ORDERS.map(option => (
                    <Cell key={option} onPress={() => onSelect(option)}>
                        <Cell.Content>
                            <Cell.Row>
                                <Cell.Title>{t(`amountDisplay.options.${option}`)}</Cell.Title>
                            </Cell.Row>
                        </Cell.Content>
                        <View style={styles.checkmarkSlot}>
                            {order === option && <Icon icon={Checkmark28} color="accent" />}
                        </View>
                    </Cell>
                ))}
                <PreviewCard>{children}</PreviewCard>
            </List.Group>
            <List.Footer style={styles.footer}>
                <Text variant="bodyM" color="tertiary">
                    {footer}
                </Text>
            </List.Footer>
        </List>
    );
};
