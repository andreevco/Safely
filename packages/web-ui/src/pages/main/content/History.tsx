import type { FC } from 'react';

import { HistoryList } from '../../../features';

// TODO: point at the transaction detail and the receive flow once either exists on the web targets
const notWired = () => undefined;

export const History: FC = () => <HistoryList onSelectActivity={notWired} onReceive={notWired} />;
