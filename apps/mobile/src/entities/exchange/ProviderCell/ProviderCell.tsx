import { useNavigation } from '@react-navigation/core';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import type { Provider } from '@safely/core';
import { useActiveBtcWallet, useOnrampWidgetMutation } from '@safely/ux';

import { Cell } from '@mobile/shared/ui';

import { styles } from './ProviderCell.styles';

type ProviderCellProps = {
    provider: Provider;
    showDivider?: boolean;
};

export const ProviderCell = (props: ProviderCellProps) => {
    const { provider, showDivider = true } = props;
    const wallet = useActiveBtcWallet();
    const navigation = useNavigation();

    const { t } = useTranslation();

    const { mutateAsync } = useOnrampWidgetMutation();

    const handleOnrampWidget = useCallback(async () => {
        await mutateAsync({
            provider: provider.info.id,
            blockchain: 'bitcoin',
            token: 'native',
            address: wallet.address
        });
    }, [mutateAsync, provider, wallet.address]);

    return (
        <Cell onPress={handleOnrampWidget} showDivider={showDivider}>
            <Cell.Image
                containerStyle={styles.image}
                type="image"
                variant="square"
                image={{ uri: provider.info.logo }}
            />
            <Cell.Content>
                <Cell.Row>
                    <Cell.Title>{provider.info.name}</Cell.Title>
                </Cell.Row>
                <Cell.Row>
                    <Cell.Subtitle color="secondary">{provider.info.description}</Cell.Subtitle>
                </Cell.Row>
                {provider.likelyUnavailable && (
                    <Cell.Row>
                        <Cell.Subvalue>{t('exchange.provider.availabilityVaries')}</Cell.Subvalue>
                    </Cell.Row>
                )}
            </Cell.Content>
            <Cell.Chevron />
        </Cell>
    );
};
