import { useState } from 'react';

import { ImportWalletDialog } from '../features/import-wallet/ImportWalletDialog';
import { Button } from '../shared/ui/button';

export const MainPage = () => {
    const [open, setOpen] = useState(false);

    return (
        <div className="mx-auto flex h-full max-w-3xl flex-col gap-6 p-6">
            <div className="space-y-1">
                <h1 className="text-2xl font-semibold text-zinc-900">Safely Web</h1>
                <p className="text-sm text-zinc-600">
                    Prototype: import wallet via recovery phrase (BIP-39 wordlist checks).
                </p>
            </div>

            <div className="flex items-center gap-3">
                <Button onClick={() => setOpen(true)}>Import wallet</Button>
            </div>

            <ImportWalletDialog open={open} onOpenChange={setOpen} />
        </div>
    );
};
