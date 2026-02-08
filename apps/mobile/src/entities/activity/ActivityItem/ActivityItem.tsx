import { Cell } from '@mobile/shared/ui';

import { BTC_ASSET } from '@safely/core';
import { BtcActivityItem, useNumberFormatter, useRate } from '@safely/ux';

type ActivityItemProps = {
    activity: BtcActivityItem;
};

export const ActivityItem = (props: ActivityItemProps) => {
    const { activity } = props;
    const formatter = useNumberFormatter();
    const rate = useRate(BTC_ASSET);

    return (
        <Cell>
            <Cell.Content>
                <Cell.Row>
                    <Cell.Title>
                        {activity.transaction.isInitiator ? 'Sent' : 'Received'}
                    </Cell.Title>
                    <Cell.Value
                        color={activity.transaction.isInitiator ? 'primary' : 'accentGreen'}
                    >
                        {activity.transaction.value.format(formatter)}
                    </Cell.Value>
                </Cell.Row>
                <Cell.Row>
                    <Cell.Subtitle>
                        {activity.transaction.isInitiator
                            ? activity.transaction.toAddress
                            : activity.transaction.fromAddress}
                    </Cell.Subtitle>
                    <Cell.Subvalue>
                        {rate.data &&
                            activity.transaction.value.convert(rate.data).format(formatter)}
                    </Cell.Subvalue>
                </Cell.Row>
            </Cell.Content>
        </Cell>
    );
};
