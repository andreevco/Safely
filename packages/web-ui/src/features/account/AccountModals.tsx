import type { FC } from 'react';

import { useActiveAccountStoreSlot } from '@safely/ux';

import { SignOutModal } from './SignOutModal';
import type { useAccountFlow } from './useAccountFlow';
import { CustomizeAccountModal } from '../../entities';

export type AccountModalsProps = {
    flow: ReturnType<typeof useAccountFlow>;
};

export const AccountModals: FC<AccountModalsProps> = ({ flow }) => {
    const accountMeta = useActiveAccountStoreSlot('meta');

    return (
        <>
            {flow.draft && (
                <CustomizeAccountModal
                    defaultName={flow.draft.name}
                    onSave={name => void flow.save(name)}
                    onClose={flow.cancel}
                />
            )}

            {flow.isSigningOut && (
                <SignOutModal
                    accountName={accountMeta?.name ?? ''}
                    onConfirm={() => void flow.signOut()}
                    onClose={flow.cancelSignOut}
                />
            )}
        </>
    );
};
