import { useNavigation } from '@react-navigation/core';
import { CommonActions } from '@react-navigation/native';
import { useCallback } from 'react';

import { useLedgerSession } from './LedgerSigningProvider';

export const useExitToConnectLedger = () => {
    const navigation = useNavigation();
    const { setFindMorePortfolioId } = useLedgerSession();

    return useCallback(() => {
        setFindMorePortfolioId(null);
        navigation.getParent()?.dispatch(
            CommonActions.reset({
                index: 1,
                routes: [{ name: 'AddWalletRootModal' }, { name: 'ConnectLedgerModal' }]
            })
        );
    }, [navigation, setFindMorePortfolioId]);
};
