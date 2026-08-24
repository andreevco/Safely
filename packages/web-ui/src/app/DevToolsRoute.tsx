import type { FC, ReactNode } from 'react';
import { useNavigate } from 'react-router';

import { ROUTE } from './routes';

export type DevToolsRouteProps = {
    render: (props: { onClose: () => void }) => ReactNode;
};

export const DevToolsRoute: FC<DevToolsRouteProps> = ({ render }) => {
    const navigate = useNavigate();

    return render({ onClose: () => void navigate(ROUTE.main, { replace: true }) });
};
