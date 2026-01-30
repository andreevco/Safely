import { Text } from '@mobile/shared/ui/Text';

import { useActiveFiat } from '@safely/ux';

export const CurrencyButton = () => {
    const activeFiat = useActiveFiat();

    return <Text color="tertiary">{activeFiat.id.symbol}</Text>;
};
