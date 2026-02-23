import { useMutation } from '@tanstack/react-query';

import { TransactionTemplate } from '@safely/core';

export function useSendAssetTransfer(transactionTemplate: TransactionTemplate | undefined) {
    return useMutation({
        async mutationFn() {
            if (!transactionTemplate) {
                throw new Error('Estimation not found');
            }

            return transactionTemplate.send();
        }
    });
}
