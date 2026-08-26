import type { FC } from 'react';

import { CustomizeWalletModal, RemoveWalletModal, SelectWalletModal } from '@safely/web-ui';

import { RecoveryPhraseFlow } from './RecoveryPhraseFlow';
import type { useWalletFlow } from './useWalletFlow';

export type WalletModalsProps = {
    flow: ReturnType<typeof useWalletFlow>;
};

export const WalletModals: FC<WalletModalsProps> = ({ flow }) => {
    const { portfolio } = flow;

    if (portfolio === null) {
        return null;
    }

    switch (flow.step) {
        case 'select':
            return (
                <SelectWalletModal
                    activePortfolioId={portfolio.id}
                    onSelect={selected => void flow.select(selected.id)}
                    onClose={flow.close}
                />
            );
        case 'edit':
            return (
                <CustomizeWalletModal
                    defaultName={portfolio.meta.name}
                    defaultIcon={portfolio.meta.icon}
                    onSave={meta => void flow.saveMeta(meta)}
                    onClose={flow.close}
                />
            );
        case 'reveal':
            return <RecoveryPhraseFlow portfolio={portfolio} onClose={flow.close} />;
        case 'remove':
            return (
                <RemoveWalletModal
                    portfolio={portfolio}
                    onRemove={() => void flow.remove()}
                    onBackUp={flow.openReveal}
                    onClose={flow.close}
                />
            );
        default:
            return null;
    }
};
