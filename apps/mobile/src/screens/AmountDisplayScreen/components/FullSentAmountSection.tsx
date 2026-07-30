import { useTranslation } from 'react-i18next';

import { useSetShowFullSentAmount, useShowFullSentAmount } from '@safely/ux';

import { Cell, List, Switch } from '@mobile/shared/ui';

import { PreviewCard } from './PreviewCard';
import { SentAmountPreview } from './SentAmountPreview';

export const FullSentAmountSection = () => {
    const { t } = useTranslation();

    const showFullSentAmount = useShowFullSentAmount();
    const setShowFullSentAmount = useSetShowFullSentAmount();

    return (
        <>
            <List.Title>{t('amountDisplay.transactionAmounts.title')}</List.Title>
            <List.Group variant="divided">
                <Cell>
                    <Cell.Content>
                        <Cell.Row>
                            <Cell.Title>
                                {t('amountDisplay.transactionAmounts.showFull.title')}
                            </Cell.Title>
                        </Cell.Row>
                        <Cell.Row>
                            <Cell.Subtitle numberOfLines={0}>
                                {t('amountDisplay.transactionAmounts.showFull.subtitle')}
                            </Cell.Subtitle>
                        </Cell.Row>
                    </Cell.Content>
                    <Switch
                        value={showFullSentAmount}
                        onPress={() => setShowFullSentAmount(!showFullSentAmount)}
                    />
                </Cell>
                <PreviewCard>
                    <SentAmountPreview />
                </PreviewCard>
            </List.Group>
        </>
    );
};
