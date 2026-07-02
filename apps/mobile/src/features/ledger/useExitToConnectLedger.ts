import { useNavigation } from '@react-navigation/core';
import { StackActions } from '@react-navigation/native';
import { useCallback } from 'react';

import { useLedgerSession } from '@safely/ux';

export const useExitToConnectLedger = () => {
    const navigation = useNavigation();
    const { setFindMorePortfolioId } = useLedgerSession();

    return useCallback(() => {
        setFindMorePortfolioId(null);
        navigation.getParent()?.dispatch(StackActions.popTo('ConnectLedgerModal'));
    }, [navigation, setFindMorePortfolioId]);
};
