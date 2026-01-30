import { useToastServiceContext } from '@mobile/shared/providers/toast';
import i18next from 'i18next';
import { FC, PropsWithChildren, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { AppContext, IAppContext } from '@safely/ux';

export const AppContextProvider: FC<PropsWithChildren> = ({ children }) => {
    const { t } = useTranslation();
    const { service } = useToastServiceContext();

    const appContext = useMemo<IAppContext>(
        () => ({
            i18n: {
                language: i18next.language,
                t
            },
            sdk: {}, // TODO: Implement IAppSdk
            version: '1.0.0',
            build: 'ios',
            toast: {
                show: service.show
            }
        }),
        [t, service]
    );

    return <AppContext value={appContext}>{children}</AppContext>;
};
