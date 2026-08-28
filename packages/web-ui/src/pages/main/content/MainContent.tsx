import type { FC } from 'react';

import type { ActivityItem } from '@safely/ux';

import { Balance } from './Balance';
import { Header } from './Header';
import { History } from './History';
import { headerStyles } from './MainContent.styles';

export type MainContentProps = {
    selectedActivityKey?: string;
    onSend: () => void;
    onSelectActivity: (activity: ActivityItem) => void;
};

export const MainContent: FC<MainContentProps> = props => (
    <>
        <div className={headerStyles}>
            <Header />
            <Balance onSend={props.onSend} />
        </div>

        <History
            selectedActivityKey={props.selectedActivityKey}
            onSelectActivity={props.onSelectActivity}
        />
    </>
);
