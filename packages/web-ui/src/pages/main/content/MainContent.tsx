import type { FC } from 'react';

import { Balance } from './Balance';
import { Header } from './Header';
import { History } from './History';
import { headerStyles } from './MainContent.styles';

export const MainContent: FC = () => (
    <>
        <div className={headerStyles}>
            <Header />
            <Balance />
        </div>

        <History />
    </>
);
