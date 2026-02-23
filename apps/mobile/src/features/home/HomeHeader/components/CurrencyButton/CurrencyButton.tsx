import { useActiveFiat } from '@safely/ux';

import { Text } from '@mobile/shared/ui/Text';

export const CurrencyButton = () => {
    const activeFiat = useActiveFiat();

    return <Text color="tertiary">{activeFiat.id.symbol}</Text>;
};
