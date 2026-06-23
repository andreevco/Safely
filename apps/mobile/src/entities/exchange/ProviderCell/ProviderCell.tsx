import { useNavigation } from '@react-navigation/core';
import { useTranslation } from 'react-i18next';

import type { Provider } from '@safely/core';
import { useDismissedProvidersQuery, useOpenOnramp } from '@safely/ux';

import { Cell } from '@mobile/shared/ui';

import { styles } from './ProviderCell.styles';

type ProviderCellProps = {
    provider: Provider;
    showDivider?: boolean;
};

export const ProviderCell = (props: ProviderCellProps) => {
    const { provider, showDivider = true } = props;
    const navigation = useNavigation();

    const { t } = useTranslation();

    const { data: dismissedProviders } = useDismissedProvidersQuery();
    const { openOnramp, isPending } = useOpenOnramp();

    const handlePress = () => {
        if (isPending) {
            return;
        }
        if (dismissedProviders?.includes(provider.info.id)) {
            void openOnramp(provider);
        } else {
            navigation.navigate('ProviderSheet', { provider });
        }
    };

    return (
        <Cell onPress={handlePress} showDivider={showDivider}>
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
                    <Cell.Subtitle numberOfLines={2} color="secondary">
                        {provider.info.description}
                    </Cell.Subtitle>
                </Cell.Row>
                {provider.likelyUnavailable && (
                    <Cell.Row>
                        <Cell.Subvalue numberOfLines={2}>
                            {t('exchange.provider.availabilityVaries')}
                        </Cell.Subvalue>
                    </Cell.Row>
                )}
            </Cell.Content>
            <Cell.Chevron />
        </Cell>
    );
};
