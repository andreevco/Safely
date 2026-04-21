import { useActiveFiat } from '@safely/ux';

import { Text } from '@mobile/shared/ui/Text';

export const CurrencyButton = () => {
    const activeFiat = useActiveFiat();

    return (
        <Text variant="bodyS" color="secondary">
            {activeFiat.id.symbol}
        </Text>
    );
};
